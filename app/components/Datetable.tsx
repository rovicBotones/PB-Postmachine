import { type News } from "~/routes/_layout.home";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, useReactTable} from "@tanstack/react-table";
import { Checkbox } from "./ui/checkbox";
import { LiaFacebookSquare  } from "react-icons/lia";
import dayjs from "dayjs";
import { Link } from "react-router";
import { useNavigation, useFetcher } from "react-router";
import type { ClientRequestArgs } from "http";
import { uploadToFacebookById } from "utils/posts.service";
import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { SiGooglesearchconsole } from "react-icons/si";
import { Edit, Eye, Upload, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

const columnHelper = createColumnHelper<News>()

const createColumns = (
  onEditClick: (post: News) => void,
  onViewClick: (post: News) => void,
  selectedPosts: Set<string>,
  onSelectPost: (postId: string, selected: boolean) => void,
  onSelectAll: (selected: boolean) => void,
  allSelected: boolean
) => [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => onSelectAll(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={selectedPosts.has(row.original.Id)}
          onCheckedChange={(value) => onSelectPost(row.original.Id, !!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  }),
  columnHelper.accessor('Date', {
    footer: info => info.column.id,
    cell: (info) => {
      const isSmallScreen = window.innerWidth < 768;
      const format = isSmallScreen ? 'M/D/YY' : 'MMM D, YY';
      return <div className="px-1 py-1 text-xs whitespace-nowrap" title={dayjs(info.getValue()).format('MMMM D, YYYY')}>{dayjs(info.getValue()).format(format)}</div>
    },
  }),
  columnHelper.accessor('Category', {
    cell: (info: any) => {
      const value = info.getValue();
      const isSmallScreen = window.innerWidth < 768;
      const maxLength = isSmallScreen ? 6 : 10;
      const display = value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
      return <div className="px-1 py-1 text-xs overflow-hidden" title={value}>{display}</div>
    },
    footer: info => info.column.id,
  }),
  columnHelper.accessor(row => row.Title, {
    id: 'title',
    cell: info => {
    const value = info.getValue() as string;
    const words = value.split(" ");
    const isSmallScreen = window.innerWidth < 768;
    const wordLimit = isSmallScreen ? 4 : 8;
    const display =
      words.length > wordLimit
        ? words.slice(0, wordLimit).join(" ") + "..."
        : value;
    return <div className="px-1 py-1 text-xs leading-tight break-words max-w-full overflow-hidden" title={value}>{display}</div>;
    },
    header: () => <span>Title</span>,
    footer: info => info.column.id,
  }),
  columnHelper.accessor('Status', {
    cell: (info: any) => {
      const value = info.getValue();
      const shortValue = value === 'Published' ? 'Pub.' : value === 'Draft' ? 'Draft' : value;
      return <div className="px-1 py-1 text-xs overflow-hidden" title={value}>{value}</div>
    },
    header: () => <span>Status</span>,
    footer: info => info.column.id,
  }),
  //   cell: (info: any) => {
  //     const status = info.getValue() || 'Not Posted';
  //     const shortStatus = status === 'Not Posted' ? 'None' :
  //                        status === 'Posting...' ? 'Post..' :
  //                        status.length > 5 ? status.substring(0, 5) : status;
  //     return (
  //       <div className="px-1 py-1">
  //         <span className={`text-xs px-1 py-0.5 rounded inline-block ${
  //           status === 'Posted'
  //             ? 'bg-blue-100 text-blue-800'
  //             : status === 'Failed'
  //             ? 'bg-red-100 text-red-800'
  //             : status === 'Posting...'
  //             ? 'bg-yellow-100 text-yellow-800'
  //             : 'bg-gray-100 text-gray-600'
  //         }`} title={status}>
  //           {shortStatus}
  //         </span>
  //       </div>
  //     );
  //   },
  //   header: () => <span className="hidden sm:inline">Facebook</span>,
  //   footer: info => info.column.id,
  // }),
  {
    accessorKey: "Action",
    header: () => <span className="grid place-items-center">Action</span>,
    cell: (cell: any) => {
      const [loading, setLoading] = useState(false);
      const uploadRow = async (value: string) => {
        setLoading(true);
        try {
         const res =  await uploadToFacebookById(value);
         if(res != 'ok') {
            toast.error("Error uploading post to Facebook. Please contact admin.");
         }
            toast.success("Post uploaded to Facebook successfully!");
        } finally {
          setLoading(false);
        }
      }
      return (
        <div className="flex gap-x-1 sm:gap-x-2 px-1 sm:px-2 py-2 justify-center items-center">
          <button
            type="button"
            className="rounded-md border border-input bg-background py-1.5 px-2 sm:py-2 sm:px-3 text-center text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
            title="View Post"
            onClick={() => onViewClick(cell.row.original)}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            className="rounded-md border border-transparent py-1.5 px-2 sm:py-2 sm:px-3 text-center text-sm bg-gray-500 hover:bg-gray-600 flex items-center justify-center text-white"
            title="Edit Post"
            onClick={() => onEditClick(cell.row.original)}
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];

type DatatableDTO = {
  posts: News[];
  role: string;
  selectedPosts?: Set<string>;
  onSelectPost?: (postId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

const Datatable = ({ posts, role, selectedPosts = new Set(), onSelectPost = () => {}, onSelectAll = () => {} }: DatatableDTO) => {
    const [localPosts, setLocalPosts] = useState<News[]>(posts);
    const [updateKey, setUpdateKey] = useState(0);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<News | null>(null);
    const [editForm, setEditForm] = useState({
      title: '',
      content: '',
      category: '',
      date: ''
    });
    const [editAttachments, setEditAttachments] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<any[]>([]);
    const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [editSaving, setEditSaving] = useState(false);

    // View modal states
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingPost, setViewingPost] = useState<News | null>(null);
    const [postDetails, setPostDetails] = useState<any>(null);
    const [postDetailsLoading, setPostDetailsLoading] = useState(false);
    const [facebookLoading, setFacebookLoading] = useState(false);
    const [wordpressLoading, setWordpressLoading] = useState(false);

    // Sync local posts with props when they change
    useEffect(() => {
        setLocalPosts(posts);
    }, [posts]);

    // Helper function to convert date to UTC+8 for datetime-local input
    const convertToUTC8DateTimeLocal = (dateString: string) => {
      // Parse the date string (could be "12/25/2024" format from the table)
      let date: Date;

      // Check if it's MM/DD/YYYY format
      if (dateString.includes('/')) {
        const [month, day, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }

      // Convert to UTC+8 timezone for display
      const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      return utc8Date.toISOString().slice(0, 16);
    };

    // Helper function to get current datetime in UTC+8 for datetime-local input
    const getCurrentUTC8DateTimeLocal = () => {
      const now = new Date();
      // Convert current time to UTC+8 timezone
      const utc8Now = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      return utc8Now.toISOString().slice(0, 16);
    };

    const handleEditClick = async (post: News) => {
      setEditingPost(post);
      setEditModalOpen(true);

      // Reset image states
      setExistingImages([]);
      setRemovedImageIds([]);
      setEditAttachments([]);

      // Fetch categories and post details with images
      setCategoriesLoading(true);
      try {
        const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL;
        const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
        const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;

        const authString = btoa(`${wpUsername}:${wpPassword}`);

        // Fetch categories
        const categoriesResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/categories?per_page=100`, {
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        });

        // Fetch post details with embedded media
        const postResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${post.Id}?_embed`, {
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        });

        if (categoriesResponse.ok) {
          const cats = await categoriesResponse.json();
          setCategories(cats);

          // Find the category ID that matches the post's category name
          const currentCategory = cats.find((cat: any) => cat.name === post.Category);
          const categoryId = currentCategory ? currentCategory.id.toString() : '';

          // Extract existing images if post response is successful
          let images: any[] = [];
          if (postResponse.ok) {
            const postData = await postResponse.json();

            // Get featured image
            if (postData._embedded && postData._embedded['wp:featuredmedia']) {
              const featuredImage = postData._embedded['wp:featuredmedia'][0];
              images.push({
                ...featuredImage,
                isFeatured: true
              });
            }

            // Get image attachments (excluding featured image)
            if (postData._embedded && postData._embedded['wp:attachment']) {
              const imageAttachments = postData._embedded['wp:attachment']
                .filter((attachment: any) =>
                  attachment.mime_type.startsWith('image/') &&
                  !images.some(img => img.id === attachment.id)
                );
              images.push(...imageAttachments.map((img: any) => ({ ...img, isFeatured: false })));
            }
          }

          setExistingImages(images);
          console.log('Existing images loaded:', images);

          setEditForm({
            title: post.Title,
            content: post.Content || '',
            category: categoryId,
            date: getCurrentUTC8DateTimeLocal() // Set to current datetime instead of post date
          });
        }
      } catch (error) {
        console.error('Error fetching categories or post details:', error);
        // Set form without category if fetch fails
        setEditForm({
          title: post.Title,
          content: post.Content || '',
          category: '',
          date: getCurrentUTC8DateTimeLocal() // Set to current datetime instead of post date
        });
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL;
        const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
        const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;

        const authString = btoa(`${wpUsername}:${wpPassword}`);
        const response = await fetch(`${wpBaseUrl}/wp-json/wp/v2/categories?per_page=100`, {
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        });

        if (response.ok) {
          const cats = await response.json();
          setCategories(cats);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Helper function to convert datetime-local to UTC+8 ISO string
    const convertToUTC8ISO = (dateTimeLocal: string) => {
      return new Date(dateTimeLocal + '+08:00').toISOString();
    };

    const handleSaveEdit = async () => {
      if (!editingPost) return;

      setEditSaving(true);
      try {
        const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL;
        const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
        const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;

        const authString = btoa(`${wpUsername}:${wpPassword}`);

        // Remove existing images that were marked for deletion
        for (const imageId of removedImageIds) {
          try {
            await fetch(`${wpBaseUrl}/wp-json/wp/v2/media/${imageId}?force=true`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${authString}`,
              },
            });
            console.log(`Deleted image ${imageId}`);
          } catch (error) {
            console.error(`Failed to delete image ${imageId}:`, error);
          }
        }

        // Upload new attachments
        const mediaIds: number[] = [];
        const mediaUrls: string[] = [];
        for (const file of editAttachments) {
          const mediaFormData = new FormData();
          mediaFormData.append('file', file);

          const mediaResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authString}`,
            },
            body: mediaFormData
          });

          if (mediaResponse.ok) {
            const mediaResult = await mediaResponse.json();
            mediaIds.push(mediaResult.id);
            mediaUrls.push(mediaResult.source_url);
            console.log(`Uploaded image: ${mediaResult.id} - ${mediaResult.source_url}`);

            // Associate the media with the post and add custom field
            const updateMediaResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/media/${mediaResult.id}`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                post: parseInt(editingPost.Id),
                meta: {
                  article_thumb: 'true'
                }
              }),
            });

            if (updateMediaResponse.ok) {
              console.log(`Associated media ${mediaResult.id} with post ${editingPost.Id} and tagged as article_thumb`);
            } else {
              console.error(`Failed to associate media ${mediaResult.id} with post`);
            }

            // Also update the post's custom fields to reference this image URL
            try {
              const postUpdateResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${editingPost.Id}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${authString}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  meta: {
                    article_thumb: mediaResult.source_url // Use the image URL instead of ID
                  }
                }),
              });

              if (postUpdateResponse.ok) {
                console.log(`Updated post ${editingPost.Id} with article_thumb custom field URL: ${mediaResult.source_url}`);
              } else {
                console.error(`Failed to update post custom field for article_thumb`);
              }
            } catch (error) {
              console.error(`Error updating post custom field:`, error);
            }
          } else {
            const errorText = await mediaResponse.text();
            console.error(`Failed to upload file ${file.name}:`, errorText);
          }
        }

        const updateData: any = {
          title: editForm.title,
          content: editForm.content,
          categories: editForm.category ? [parseInt(editForm.category)] : undefined,
          date: convertToUTC8ISO(editForm.date),
        };

        // Only update featured_media if we uploaded new images or if there are no existing images
        if (mediaIds.length > 0) {
          updateData.featured_media = mediaIds[0]; // Set first new upload as featured image
          updateData.meta = {
            article_thumb: mediaUrls[0] // Set the first uploaded image URL as article_thumb
          };
          console.log(`Setting featured media to: ${mediaIds[0]} and article_thumb custom field URL: ${mediaUrls[0]}`);
        } else if (existingImages.length === 0 && removedImageIds.length > 0) {
          // If we removed all existing images and didn't upload new ones, clear featured media and custom field
          updateData.featured_media = null;
          updateData.meta = {
            article_thumb: '' // Clear the article_thumb custom field
          };
          console.log('Clearing featured media and article_thumb custom field - no images left');
        }
        // If we have existing images and no new uploads, don't change featured_media or custom fields

        const response = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${editingPost.Id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          const updatedPost = await response.json();

          // Find the category name
          const selectedCategory = categories.find((cat: any) => cat.id.toString() === editForm.category);
          const categoryName = selectedCategory ? selectedCategory.name : editingPost.Category;

          // Update local posts state
          setLocalPosts(prevPosts =>
            prevPosts.map(post =>
              post.Id === editingPost.Id
                ? {
                    ...post,
                    Title: editForm.title,
                    Content: editForm.content,
                    Category: categoryName
                  }
                : post
            )
          );

          // Force re-render
          setUpdateKey(prev => prev + 1);

          // Success message with details about image operations
          let successMessage = 'Post updated successfully!';
          if (mediaIds.length > 0) {
            successMessage += ` ${mediaIds.length} new image(s) uploaded.`;
          }
          if (removedImageIds.length > 0) {
            successMessage += ` ${removedImageIds.length} image(s) removed.`;
          }

          toast.success(successMessage);
          setEditModalOpen(false);
          // Clear all image states
          setEditAttachments([]);
          setExistingImages([]);
          setRemovedImageIds([]);
        } else {
          const errorData = await response.text();
          console.error('Failed to update post:', errorData);
          toast.error('Failed to update post: ' + response.statusText);
        }
      } catch (error) {
        console.error('Error updating post:', error);
        toast.error('Error updating post');
      } finally {
        setEditSaving(false);
      }
    };

    const handleViewClick = async (post: News) => {
      setViewingPost(post);
      setViewModalOpen(true);
      setPostDetailsLoading(true);

      try {
        const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL;
        const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
        const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;

        const authString = btoa(`${wpUsername}:${wpPassword}`);

        // Fetch full post details including featured media
        const response = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${post.Id}?_embed`, {
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        });

        if (response.ok) {
          const details = await response.json();
          setPostDetails(details);
        } else {
          console.error('Failed to fetch post details');
          setPostDetails(null);
        }
      } catch (error) {
        console.error('Error fetching post details:', error);
        setPostDetails(null);
      } finally {
        setPostDetailsLoading(false);
      }
    };

    const handleFacebookPost = async (postId: string) => {
      setFacebookLoading(true);
      try {
        const res = await uploadToFacebookById(postId);
        console.log('res: ', res);
        if(res === 'ok') {
          toast.success("Post uploaded to Facebook successfully!");
        } else {
          toast.error("Error uploading post to Facebook. Please contact admin.");
        }
      } catch (error) {
        toast.error("Error uploading post to Facebook. Please contact admin.");
      } finally {
        setFacebookLoading(false);
      }
    };

    const handleFileUpload = (files: FileList | null) => {
      if (!files) return;

      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" is not an image file. Only images are allowed.`);
          continue;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`"${file.name}" is too large. Maximum file size is 5MB.`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setEditAttachments(prev => [...prev, ...validFiles]);
      }
    };

    const removeAttachment = (index: number) => {
      setEditAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imageId: number) => {
      setRemovedImageIds(prev => [...prev, imageId]);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    };

    const restoreExistingImage = (imageId: number) => {
      setRemovedImageIds(prev => prev.filter(id => id !== imageId));
      // Note: We don't restore the image to existingImages here because we'd need to fetch it again
      // Instead, we'll handle this in the save logic
    };

    const handleWordpressPublish = async (postId: string) => {
      setWordpressLoading(true);
      try {
        const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL;
        const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
        const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;

        const authString = btoa(`${wpUsername}:${wpPassword}`);

        const updateData = {
          status: 'publish'
        };

        const response = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${postId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          const updatedPost = await response.json();

          // Check if the published post should remain in the current view
          // If it's category 6 (which is excluded from published posts), remove it
          const postToUpdate = localPosts.find(post => post.Id === postId);

          if (postToUpdate && postToUpdate.Category === 'Classified Ads') {
            // Remove the post from the table since published posts exclude category 6
            setLocalPosts(prevPosts =>
              prevPosts.filter(post => post.Id !== postId)
            );
            toast.success('Draft published to CMS successfully! Post moved to published section.');
          } else {
            // Update the status to Published
            setLocalPosts(prevPosts =>
              prevPosts.map(post =>
                post.Id === postId
                  ? { ...post, Status: 'Published' }
                  : post
              )
            );

            // Update viewing post if it's the same post
            if (viewingPost && viewingPost.Id === postId) {
              setViewingPost(prev => prev ? { ...prev, Status: 'Published' } : null);
            }

            toast.success('Draft published to CMS successfully!');
          }

          // Force re-render
          setUpdateKey(prev => prev + 1);

          setViewModalOpen(false);
        } else {
          toast.error('Failed to publish draft to CMS');
        }
      } catch (error) {
        console.error('Error publishing to CMS:', error);
        toast.error('Error publishing to CMS');
      } finally {
        setWordpressLoading(false);
      }
    };

    const allSelected = localPosts.length > 0 && localPosts.every(post => selectedPosts.has(post.Id));
    const columns = createColumns(handleEditClick, handleViewClick, selectedPosts, onSelectPost, onSelectAll, allSelected);


    const table = useReactTable({
        data: localPosts,
        columns,
        defaultColumn: {
          minSize: 80,
          maxSize: 400,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
          sorting: [{ id: 'Category', desc: false }],
          pagination: {
            pageSize: 10,
          },
          columnSizing: {
            select: 40,
            Date: 90,
            Category: 90,
            title: 220,
            Status: 80,
            Action: 100,
          },
        },
      });

    return (
      <>
      <div className="w-full">
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
          <Table key={updateKey} className="w-full min-w-[700px]">
              <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                      <TableHead className="border border-gray-300 px-2 py-3 text-left text-xs sm:text-sm font-medium" key={header.id}>
                          {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                              )}
                      </TableHead>
                      ))}
                  </TableRow>
                  ))}
              </TableHeader>
              <TableBody className="">
                  {table.getRowModel().rows.map(row => (
                  <TableRow className="" key={row.id}>
                      {row.getVisibleCells().map(cell => (
                      <TableCell className="border border-gray-300 px-2 py-3 text-xs sm:text-sm" key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                      ))}
                  </TableRow>
                  ))}
              </TableBody>
              {/* <TableFooter>
                  <TableRow>
                      <TableCell className="px-2 py-3">
                        Count: {localPosts.length}
                      </TableCell>
                  </TableRow>
              </TableFooter> */}
              </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 lg:gap-4 px-2 py-3 bg-gray-50 border-t">
          <div className="flex items-center space-x-2">
            <p className="text-xs lg:text-sm text-gray-700 whitespace-nowrap">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, localPosts.length)} of{' '}
              {localPosts.length}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-2">
              <p className="text-xs whitespace-nowrap">Rows:</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="border border-gray-300 rounded px-1 py-1 text-xs bg-white"
              >
                {[5, 10, 20, 50].map(pageSize => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-7 w-7 p-0"
                title="First page"
              >
                <ChevronsLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-7 w-7 p-0"
                title="Previous page"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              <div className="flex items-center px-1">
                <span className="text-xs whitespace-nowrap">
                  {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-7 w-7 p-0"
                title="Next page"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-7 w-7 p-0"
                title="Last page"
              >
                <ChevronsRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Credenza open={editModalOpen} onOpenChange={setEditModalOpen}>
        <CredenzaContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <CredenzaHeader>
            <CredenzaTitle className="text-lg sm:text-xl">Edit Post</CredenzaTitle>
            <CredenzaDescription className="text-sm">
              Make changes to the post below.
            </CredenzaDescription>
          </CredenzaHeader>

          <CredenzaBody className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter post title"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-sm font-medium">Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Enter post content"
                className="min-h-[120px] w-full resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-sm font-medium">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                disabled={categoriesLoading}
              >
                <SelectTrigger id="edit-category" className="w-full">
                  <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    !categoriesLoading && (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No categories available
                      </div>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date" className="text-sm font-medium">Publish Date</Label>
              <Input
                id="edit-date"
                type="datetime-local"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Timezone: UTC+8 (Asia/Manila, Asia/Singapore, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Images</Label>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Current images:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative">
                        <div className="aspect-square rounded-lg overflow-hidden border bg-gray-50">
                          <img
                            src={image.source_url}
                            alt={image.alt_text || image.title?.rendered || 'Existing image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {image.isFeatured && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Featured
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {image.title?.rendered || `Image ${image.id}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="edit-file-upload"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <label
                  htmlFor="edit-file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload new images
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG up to 5MB each
                  </p>
                </label>
              </div>

              {/* New Upload Preview */}
              {editAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">New uploads:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {editAttachments.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square rounded-lg overflow-hidden border bg-gray-50">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          New
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove file"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CredenzaBody>

          <CredenzaFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              onClick={handleSaveEdit}
              variant="default"
              className="w-full sm:w-auto order-2 sm:order-1"
              disabled={editSaving}
            >
              {editSaving ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <CredenzaClose asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto order-1 sm:order-2"
                disabled={editSaving}
              >
                Cancel
              </Button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* View Modal */}
      <Credenza open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <CredenzaContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <CredenzaHeader>
            <CredenzaTitle className="text-lg sm:text-xl">View Post</CredenzaTitle>
            <CredenzaDescription className="text-sm">
              Post details and attachments
            </CredenzaDescription>
          </CredenzaHeader>

          <CredenzaBody className="space-y-4 px-1">
            {postDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin h-6 w-6" />
                <span className="ml-2">Loading post details...</span>
              </div>
            ) : viewingPost && (
              <>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Title</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{viewingPost.Title}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Content</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border max-h-48 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{viewingPost.Content}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Category</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <p className="text-sm">{viewingPost.Category}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <span className={`text-sm px-2 py-1 rounded ${
                          viewingPost.Status === "Draft"
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {viewingPost.Status}
                        </span>
                      </div>
                    </div>


                    <div>
                      <Label className="text-sm font-medium text-gray-700">Date</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                        <p className="text-sm">{viewingPost.Date}</p>
                      </div>
                    </div>
                  </div>

                  {/* Featured Image */}
                  {postDetails && postDetails._embedded && postDetails._embedded['wp:featuredmedia'] && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Featured Image</Label>
                      <div className="mt-1 border rounded-md overflow-hidden">
                        <img
                          src={postDetails._embedded['wp:featuredmedia'][0].source_url}
                          alt={postDetails._embedded['wp:featuredmedia'][0].alt_text || 'Featured image'}
                          className="w-full max-h-64 object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Attachments */}
                  {postDetails && postDetails._embedded && postDetails._embedded['wp:attachment'] &&
                   postDetails._embedded['wp:attachment'].filter((attachment: any) => attachment.mime_type.startsWith('image/')).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Image Attachments</Label>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {postDetails._embedded['wp:attachment']
                          .filter((attachment: any) => attachment.mime_type.startsWith('image/'))
                          .map((image: any) => (
                            <div key={image.id} className="space-y-2">
                              <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
                                <img
                                  src={image.source_url}
                                  alt={image.alt_text || image.title?.rendered || 'Image attachment'}
                                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(image.source_url, '_blank')}
                                  title="Click to view full size"
                                />
                              </div>
                              {image.caption?.rendered && (
                                <p className="text-xs text-gray-600 px-1" dangerouslySetInnerHTML={{ __html: image.caption.rendered }} />
                              )}
                              {image.title?.rendered && (
                                <p className="text-xs font-medium text-gray-700 px-1">{image.title.rendered}</p>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* All Attachments (non-image) */}
                  {postDetails && postDetails._embedded && postDetails._embedded['wp:attachment'] &&
                   postDetails._embedded['wp:attachment'].filter((attachment: any) => !attachment.mime_type.startsWith('image/')).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Other Attachments</Label>
                      <div className="mt-2 space-y-2">
                        {postDetails._embedded['wp:attachment']
                          .filter((attachment: any) => !attachment.mime_type.startsWith('image/'))
                          .map((attachment: any) => (
                            <div key={attachment.id} className="flex items-center p-3 border rounded-lg bg-gray-50">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{attachment.title?.rendered || 'Attachment'}</p>
                                <p className="text-xs text-gray-600">{attachment.mime_type}</p>
                              </div>
                              <button
                                onClick={() => window.open(attachment.source_url, '_blank')}
                                className="ml-3 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Download
                              </button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CredenzaBody>

          <CredenzaFooter className="flex flex-col sm:flex-row gap-2 justify-between pt-4">
            <div className="flex gap-2">
              {viewingPost && viewingPost.Status === "Draft" && role === "admin" && (
                <Button
                  onClick={() => handleWordpressPublish(viewingPost.Id)}
                  disabled={wordpressLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {wordpressLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish to CMS
                    </>
                  )}
                </Button>
              )}
              {viewingPost && viewingPost.Status === "Published" && role === "admin" && (
                (() => {
                  // Check if post has images (featured image or attachments)
                  const hasFeaturedImage = postDetails && postDetails._embedded && postDetails._embedded['wp:featuredmedia'];
                  const hasImageAttachments = postDetails && postDetails._embedded && postDetails._embedded['wp:attachment'] &&
                    postDetails._embedded['wp:attachment'].filter((attachment: any) => attachment.mime_type.startsWith('image/')).length > 0;
                  const hasImages = hasFeaturedImage || hasImageAttachments;

                  if (hasImages) {
                    return (
                      <Button
                        onClick={() => handleFacebookPost(viewingPost.Id)}
                        disabled={facebookLoading}
                        className="bg-[#1877F2] hover:bg-sky-700 text-white"
                      >
                        {facebookLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <LiaFacebookSquare className="mr-2 h-4 w-4" />
                            Post to Facebook
                          </>
                        )}
                      </Button>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span className="text-sm text-yellow-800">
                          Add an image to post to Facebook
                        </span>
                      </div>
                    );
                  }
                })()
              )}
            </div>
            <CredenzaClose asChild>
              <Button variant="outline">Close</Button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
      </>
    );

}

export default Datatable;