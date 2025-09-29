import { getAllData, postAll, publishAllDrafts } from "utils/posts.service";
import React, { useEffect } from "react";
import Datatable from "~/components/Datetable";
import Filter from "~/components/Filter";
import { Link, redirect, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/_layout.home";
import { isAuthenticated, session } from "utils/auth.service";
import { getUserRole } from "utils/users.service";
import { fetchUserPermissions } from "utils/role.service";
import { toast } from "sonner";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "~/components/ui/credenza";
import { AlertTriangle } from "lucide-react";
import { useSearchParams } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CSVLink, CSVDownload } from "react-csv";
import { sub } from "date-fns";
import dayjs from "dayjs";
import type { l } from "node_modules/vite/dist/node/types.d-aGj9QkWt";

export function meta({}: Route.MetaArgs) {
  return [{ title: "PB Post Machine" }];
}
export type News = {
  Id: string;
  Date: string;
  Category: string;
  Title: string;
  Author: string;
  Status: string;
  Content: string;
};

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  try {
    const isLoggedIn = await isAuthenticated();
    const sessDetails = await session();

    console.log('Session details:', sessDetails);
    console.log('Is logged in:', isLoggedIn);

    if (!isLoggedIn) {
      toast("My first toast");
      return redirect("/");
    }

    // if (!sessDetails || !sessDetails.sessionDetails) {
    //   console.error('No session details found:', sessDetails);
    //   throw new Error('Session details are missing');
    // }

    console.log('✅ Valid session found for user:', sessDetails.sessionDetails);
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const dateToday = new Date();
    const dateFilter = date ? new Date(date) : dateToday;
    // For super admin, override role detection
    const userId = sessDetails?.sessionDetails;
    const protectedUserId = import.meta.env.VITE_PROTECTED_USER_ID || '58eb73bd-f087-47f8-a6b3-11c08c6f7eb4';

    // if (!userId) {
    //   console.error('No user ID found in session');
    //   throw new Error('User ID not found in session');
    // }

    console.log('=== ROLE DEBUGGING ===');
    console.log('Current user ID:', userId);
    console.log('Protected user ID from env:', protectedUserId);
    console.log('User ID type:', typeof userId);
    console.log('Protected ID type:', typeof protectedUserId);
    console.log('Are they equal (===):', userId === protectedUserId);
    console.log('Are they equal (==):', userId == protectedUserId);
    console.log('All env vars:', import.meta.env);

    const isSuperAdmin = userId === protectedUserId;let role = await getUserRole(userId);
    const userPermissions = await fetchUserPermissions(userId);

    // Check for specific permissions
    const hasAddArticlePermission = userPermissions.some(p => p.permission_value === 'articles.add');
    const hasPostPermission = userPermissions.some(p => p.permission_value === 'post.post');
    const hasPublishPermission = userPermissions.some(p => p.permission_value === 'articles.publish');

    // For super admin, grant all permissions (using same isSuperAdmin check)
    const finalAddPermission = isSuperAdmin || hasAddArticlePermission;
    const finalPostPermission = isSuperAdmin || hasPostPermission;
    const finalPublishPermission = isSuperAdmin || hasPublishPermission;

    console.log('hasAddArticlePermission:', hasAddArticlePermission);
    console.log('hasPostPermission:', hasPostPermission);
    console.log('hasPublishPermission:', hasPublishPermission);
    console.log('isSuperAdmin:', isSuperAdmin);
    console.log('finalAddPermission:', finalAddPermission);
    console.log('finalPostPermission:', finalPostPermission);
    console.log('finalPublishPermission:', finalPublishPermission);

    // Extract filter parameters from URL
    const categoryParam = url.searchParams.get("category") || "";
    const titleParam = url.searchParams.get("title") || "";

    console.log("🔍 SERVER-SIDE FILTERING:");
    console.log("   Date:", dateFilter);
    console.log("   Category (raw):", categoryParam);
    console.log("   Title:", titleParam);

    // Build filter object for server-side processing
    const filter = {
      Date: dateFilter,
      Category: categoryParam, // Keep original case from URL
      Title: titleParam,
    };
    console.log("📋 Filter object passed to getAllData:", filter);
    type Data = {
      Id: string;
      Date: string;
      Category: string;
      Title: string;
      Content: string;
    };
    const datas: Data[] = await getAllData(filter);
    console.log("isLoggedIn: ", role);


    datas.map((x) => {
      x.role = role;
    });
    console.log('datadsdsdsds: ', datas);
    console.log('Returning from loader with role:', role);
    console.log('Returning permissions:', {
      canAddArticle: finalAddPermission,
      canPost: finalPostPermission,
      canPublish: finalPublishPermission
    });

    return {
      datas: datas,
      filter: filter,
      role: role,
      permissions: {
        canAddArticle: finalAddPermission,
        canPost: finalPostPermission,
        canPublish: finalPublishPermission
      }
    };
  } catch (error) {
    console.error('Error in clientLoader:', error);

    // If it's a session error, redirect to login
    if (error.message.includes('session') || error.message.includes('User ID')) {
      return redirect('/');
    }

    return {
      datas: [],
      filter: { Date: new Date(), Category: '', Title: '' },
      role: null,
      permissions: {
        canAddArticle: false,
        canPost: false,
        canPublish: false
      }
    };
  }
}
export function HydrateFallback() {
  return <div>Loading...</div>;
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  console.log("clientAction triggered", request);
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const posts = loaderData || { datas: [], filter: {}, role: null, permissions: {} };
  const dateNowString = dayjs(posts.filter?.Date || new Date()).format("MMMM D, YYYY");
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState(false);
  const [publishLoading, setPublishLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [selectedPosts, setSelectedPosts] = React.useState<Set<string>>(new Set());
  const [postsWithImagesCount, setPostsWithImagesCount] = React.useState(0);
  const [checkingImages, setCheckingImages] = React.useState(false);

  // Check if we're loading due to navigation (filter changes)
  const isFilterLoading = navigation.state === "loading";

  // Function to check if a post has images
  const checkPostHasImages = async (postId: string): Promise<boolean> => {
    try {
      const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL;
      const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
      const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;
      const authString = btoa(`${wpUsername}:${wpPassword}`);

      const response = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${postId}?_embed`, {
        headers: {
          'Authorization': `Basic ${authString}`,
        },
      });

      if (response.ok) {
        const postDetails = await response.json();

        // Check for featured image
        const hasFeaturedImage = postDetails._embedded && postDetails._embedded['wp:featuredmedia'];

        // Check for image attachments
        const hasImageAttachments = postDetails._embedded && postDetails._embedded['wp:attachment'] &&
          postDetails._embedded['wp:attachment'].filter((attachment: any) => attachment.mime_type.startsWith('image/')).length > 0;

        return hasFeaturedImage || hasImageAttachments;
      }
      return false;
    } catch (error) {
      console.error('Error checking post images:', error);
      return false;
    }
  };

  // Function to count posts with images
  const updatePostsWithImagesCount = async () => {
    if (selectedPosts.size === 0) {
      setPostsWithImagesCount(0);
      return;
    }

    setCheckingImages(true);
    try {
      const selectedPostsData = (posts.datas || []).filter(post => selectedPosts.has(post.Id));
      let count = 0;

      for (const post of selectedPostsData) {
        const hasImages = await checkPostHasImages(post.Id);
        if (hasImages) {
          count++;
        }
      }

      setPostsWithImagesCount(count);
    } catch (error) {
      console.error('Error counting posts with images:', error);
      setPostsWithImagesCount(0);
    } finally {
      setCheckingImages(false);
    }
  };

  // Update image count when selected posts change
  React.useEffect(() => {
    updatePostsWithImagesCount();
  }, [selectedPosts]);

  const handlePostAll = async () => {
    setLoading(true);
    try {
      setOpen(false);
      // Get selected posts data
      const selectedPostsData = (posts.datas || []).filter(post => selectedPosts.has(post.Id));
      if (selectedPostsData.length === 0) {
        toast.error("Please select at least one post to upload to Facebook.");
        return;
      }

      // Check which selected posts have images
      const postsWithImages: string[] = [];
      const postsWithoutImages: string[] = [];

      for (const post of selectedPostsData) {
        const hasImages = await checkPostHasImages(post.Id);
        if (hasImages) {
          postsWithImages.push(post.Id);
        } else {
          postsWithoutImages.push(post.Id);
        }
      }

      if (postsWithImages.length === 0) {
        toast.error("No selected posts have images. Only posts with images can be posted to Facebook.");
        return;
      }

      // Post only posts with images
      const results = await postAll({ ...posts.filter, selectedPostIds: postsWithImages });

      // Count successful and failed posts
      const successCount = results.filter(r => r.status === 'success').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      let message = "";
      if (postsWithoutImages.length > 0) {
        message += `${postsWithoutImages.length} post(s) skipped (no images). `;
      }

      if (failCount > 0) {
        message += `Posted ${successCount} posts to Facebook, ${failCount} failed.`;
        toast.error(message);
      } else {
        message += `${successCount} posts with images successfully posted to Facebook!`;
        toast.success(message);
      }

      // Force page refresh to show updated data
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAllDrafts = async () => {
    setPublishLoading(true);
    try {
      setPublishOpen(false);
      // Get selected draft posts
      const selectedDrafts = (posts.datas || []).filter(post => selectedPosts.has(post.Id) && post.Status === "Draft");
      if (selectedDrafts.length === 0) {
        toast.error("Please select at least one draft post to publish.");
        return;
      }

      const results = await publishAllDrafts({ ...posts.filter, selectedPostIds: Array.from(selectedPosts) });
      const successCount = results.filter(r => r.status === 'success').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      if (failCount > 0) {
        toast.error(`Published ${successCount} drafts, ${failCount} failed`);
      } else {
        toast.success(`Successfully published ${successCount} selected draft posts!`);
      }

      // Refresh the page to show updated data
      window.location.reload();
    } finally {
      setPublishLoading(false);
    }
  };
  const data: { [key: string]: string }[] = [];
  const headers: { [key: string]: string }[] = [];
  let obj: { [key: string]: string } = {};
  let sportsCount = 0;
  let contCount = 0;
  let shCount = 0;
  let edCount = 0;
  (posts.datas || []).forEach((x, i) => {
    obj["date"] = dateNowString;
    if(x.Category === "Headlines") {
      obj["headline"] = x.Title;
      obj["headlinecontent"] = x.Content;
    }
    if(x.Category === "Subheadlines") {
      obj["subheadline"] = x.Title;
      obj["subheadlinecontent"] = x.Content;
    }
    if (x.Category === "Sports") {
      sportsCount++;
      obj[`sport${sportsCount}`] = x.Title;
      obj[`sportcontent${sportsCount}`] = x.Content;
    }
    if (x.Category === "Contributors") {
      contCount++;
      obj[`cont${contCount}`] = x.Title;
      obj[`contcontent${contCount}`] = x.Content;
    }
    if (x.Category === "Showbiz") {
      shCount++;
      obj[`sh${shCount}`] = x.Title;
      obj[`shcontent${shCount}`] = x.Content;
    }
    if (x.Category === "Editorial") {
      edCount++;
      obj[`ed${edCount}`] = x.Title;
      obj[`edcontent${edCount}`] = x.Content;
    }
  });
  data.push(obj);
  Object.entries(obj).map(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    headers.push({ label, key });
  });
   console.log("headers: ", headers);
  console.log("data: ", data);

  const handleDownload = () => {
    if (selectedPosts.size === 0) {
      toast.error("Please select at least one post to export.");
      return;
    }

    const filename = "export.txt"
    const selectedData: { [key: string]: string }[] = [];
    const selectedHeaders: { [key: string]: string }[] = [];
    let obj: { [key: string]: string } = {};
    let sportsCount = 0;
    let contCount = 0;
    let shCount = 0;
    let edCount = 0;

    // Filter only selected posts
    const selectedPostsData = (posts.datas || []).filter(post => selectedPosts.has(post.Id));

    selectedPostsData.forEach((x, i) => {
      obj["date"] = dateNowString;
      if(x.Category === "Headlines") {
        obj["headline"] = x.Title;
        obj["headlinecontent"] = x.Content;
      }
      if(x.Category === "Subheadlines") {
        obj["subheadline"] = x.Title;
        obj["subheadlinecontent"] = x.Content;
      }
      if (x.Category === "Sports") {
        sportsCount++;
        obj[`sport${sportsCount}`] = x.Title;
        obj[`sportcontent${sportsCount}`] = x.Content;
      }
      if (x.Category === "Contributors") {
        contCount++;
        obj[`cont${contCount}`] = x.Title;
        obj[`contcontent${contCount}`] = x.Content;
      }
      if (x.Category === "Showbiz") {
        shCount++;
        obj[`sh${shCount}`] = x.Title;
        obj[`shcontent${shCount}`] = x.Content;
      }
      if (x.Category === "Editorial") {
        edCount++;
        obj[`ed${edCount}`] = x.Title;
        obj[`edcontent${edCount}`] = x.Content;
      }
    });
    selectedData.push(obj);
    Object.entries(obj).map(([key, value]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      selectedHeaders.push({ label, key });
    });

    // Build header row
    const headerRow = selectedHeaders.map(h => h.label).join("\t");

    // Build rows
    const rows = selectedData.map(row =>
      selectedHeaders.map(h => (row[h.key] !== undefined ? String(row[h.key]) : "")).join("\t")
    );

    // Join with CRLF, strip BOM
    const cleanContent = [headerRow, ...rows].join("\r\n").replace(/^\uFEFF/, "");

    // Create blob
    const blob = new Blob([cleanContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  };
  console.log("ROLE: ", posts.role);
  console.log("PERMISSIONS: ", posts.permissions);
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <Filter />
        <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <div className="w-full">
            <Button
              variant={"go"}
              onClick={handleDownload}
              className="w-full"
              disabled={selectedPosts.size === 0}
            >
              Export CSV ({selectedPosts.size} selected)
            </Button>
          </div>
          {posts.permissions?.canAddArticle ? (
            <>
            <div className="w-full">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/add-article">Add Article</Link>
              </Button>
            </div>
            </>
          ) : null}
          
          <div className="w-full">
            <Credenza open={publishOpen} onOpenChange={setPublishOpen}>
              <CredenzaTrigger asChild>
                <Button
                  variant="secondary"
                  disabled={publishLoading || selectedPosts.size === 0 || (posts.datas || []).filter(p => selectedPosts.has(p.Id) && p.Status === "Draft").length === 0}
                  className="w-full"
                >
                  {publishLoading ? "Publishing..." : "Publish All Drafts"}
                </Button>
              </CredenzaTrigger>
              <CredenzaContent className="w-[95vw] max-w-md">
                <CredenzaHeader>
                  <CredenzaTitle>Publish All Drafts</CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody>
                  Are you sure you want to publish{" "}
                  <b className="text-blue-600">
                    {(posts.datas || []).filter(p => selectedPosts.has(p.Id) && p.Status === "Draft").length}
                  </b>{" "}
                  selected draft posts to CMS?
                </CredenzaBody>
                <CredenzaFooter className="flex flex-col sm:flex-row gap-2">
                  {posts.permissions?.canPublish ? (
                    <>
                      <Button
                        variant="go"
                        onClick={handlePublishAllDrafts}
                        disabled={publishLoading}
                        className="w-full sm:w-auto"
                      >
                        Yes
                      </Button>
                      <CredenzaClose asChild>
                        <Button className="w-full sm:w-auto">No</Button>
                      </CredenzaClose>
                    </>
                  ) : (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        You dont have permission
                      </AlertDescription>
                    </Alert>
                  )}
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </div>
          <div className="w-full">
            <Credenza open={open} onOpenChange={setOpen}>
              <CredenzaTrigger asChild>
                <Button
                  disabled={selectedPosts.size === 0 || loading || checkingImages}
                  className="w-full bg-[#1877F2] hover:bg-sky-700 text-white"
                >
                  {loading ? "Posting..." : checkingImages ? "Checking images..." : "Post All to Facebook"}
                </Button>
              </CredenzaTrigger>
              <CredenzaContent className="w-[95vw] max-w-md">
                <CredenzaHeader>
                  <CredenzaTitle>Bulk Posting</CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="space-y-3">
                  {checkingImages ? (
                    <div className="flex items-center justify-center py-4">
                      <span className="text-sm">Checking posts for images...</span>
                    </div>
                  ) : (
                    <>
                      <div>
                        Are you sure you want to post{" "}
                        <b className="text-blue-600">
                          {postsWithImagesCount}
                        </b>{" "}
                        {postsWithImagesCount === 1 ? "article" : "articles"} with images to Facebook?
                      </div>

                      {selectedPosts.size > postsWithImagesCount && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <div className="text-sm text-yellow-800">
                              <strong>{selectedPosts.size - postsWithImagesCount}</strong> selected post(s) will be skipped because they don't have images. Only posts with images can be posted to Facebook.
                            </div>
                          </div>
                        </div>
                      )}

                      {postsWithImagesCount === 0 && selectedPosts.size > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center mt-0.5">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <div className="text-sm text-red-800">
                              None of the selected posts have images. Please select posts with images to post to Facebook.
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CredenzaBody>

                <CredenzaFooter className="flex flex-col sm:flex-row gap-2">
                  {posts.permissions?.canPost ? (
                    <>
                      <Button
                        variant="go"
                        id="logout"
                        onClick={handlePostAll}
                        disabled={loading || checkingImages || postsWithImagesCount === 0}
                        className="w-full sm:w-auto"
                      >
                        Yes
                      </Button>
                      <CredenzaClose asChild>
                        <Button className="w-full sm:w-auto">No</Button>
                      </CredenzaClose>
                    </>
                  ) : (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        You dont have permission
                      </AlertDescription>
                    </Alert>
                  )}
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </div>
        </div>
        <div className="min-h-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm relative">
          {/* Loading overlay */}
          {isFilterLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 font-medium">Loading filtered results...</p>
              </div>
            </div>
          )}

          <Datatable
            posts={posts.datas}
            role={posts.role}
            selectedPosts={selectedPosts}
            onSelectPost={(postId: string, selected: boolean) => {
              const newSelected = new Set(selectedPosts);
              if (selected) {
                newSelected.add(postId);
              } else {
                newSelected.delete(postId);
              }
              setSelectedPosts(newSelected);
            }}
            onSelectAll={(selected: boolean) => {
              if (selected) {
                setSelectedPosts(new Set((posts.datas || []).map(post => post.Id)));
              } else {
                setSelectedPosts(new Set());
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
