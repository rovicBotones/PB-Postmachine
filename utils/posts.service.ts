
import dayjs from "dayjs";

type FilterDto = {
    Date: Date | undefined;
    Category: string;
    Title: string;
    selectedPostIds?: string[];
}

// Get all available categories from WordPress (including draft post counts)
export const getAllCategories = async () => {
    const restApiUrl = `${import.meta.env.VITE_WORDPRESS_BASE_URL}/wp-json/wp/v2`;
    const authHeaders = {
        'Authorization': `Basic ${btoa(`${import.meta.env.VITE_WP_APP_USERNAME}:${import.meta.env.VITE_WP_APP_PASSWORD}`)}`
    };

    try {
        // Get categories with published post counts
        const response = await fetch(`${restApiUrl}/categories?per_page=100&exclude=6`);
        const categories = await response.json();

        if (Array.isArray(categories)) {
            // For each category, get draft post count and add to published count
            const categoriesWithDraftCounts = await Promise.all(
                categories.map(async (cat) => {
                    try {
                        // Get draft posts count for this category
                        const draftResponse = await fetch(
                            `${restApiUrl}/posts?categories=${cat.id}&status=draft&per_page=1`,
                            { headers: authHeaders }
                        );

                        if (draftResponse.ok) {
                            const totalHeader = draftResponse.headers.get('X-WP-Total');
                            const draftCount = totalHeader ? parseInt(totalHeader) : 0;

                            return {
                                id: cat.id,
                                name: cat.name,
                                slug: cat.slug,
                                count: cat.count + draftCount // Published + Draft counts
                            };
                        }
                    } catch (error) {
                        console.warn(`Error getting draft count for category ${cat.name}:`, error);
                    }

                    // Fallback to just published count
                    return {
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        count: cat.count
                    };
                })
            );

            return categoriesWithDraftCounts;
        }
        return [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};


export const getAllData = async (filter: FilterDto) => {
    const dateTsss = dayjs(filter.Date).format('YYYY-MM-DD');
    console.log('🚀 === STARTING GETALLDATA ===');
    console.log('📅 Selected date:', dateTsss);
    console.log('📅 Filter date object:', filter.Date);
    console.log('🏷️ Category filter:', filter.Category);
    console.log('📋 Full filter object:', filter);

    // Use WordPress base URL from env
    const restApiUrl = `${import.meta.env.VITE_WORDPRESS_BASE_URL}/wp-json/wp/v2`;

    // Set up authentication headers for draft posts
    const authHeaders = {
      'Authorization': `Basic ${btoa(`${import.meta.env.VITE_WP_APP_USERNAME}:${import.meta.env.VITE_WP_APP_PASSWORD}`)}`
    };

    function decodeHtmlEntities(str) {
      const txt = document.createElement("textarea");
      txt.innerHTML = str;
      return txt.value;
    }

    function stripHtmlTags(str) {
      return str.replace(/<[^>]*>?/gm, "").replace(/\n/g, "");
    }

    const datas = [];

    try {
      // Prepare date filtering
      const dateStr = dayjs(filter.Date).format('YYYY-MM-DD');
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;

      console.log('📅 Date filter:', dateStr);
      console.log('📅 Date range:', startOfDay, 'to', endOfDay);
      console.log('📅 Selected date object:', filter.Date);

      // Prepare category filter - lookup category ID from name
      let categoryId = null;
      if (filter.Category) {
        console.log('🏷️ === SETTING UP CATEGORY FILTER ===');
        console.log('🏷️ Looking up category ID for name:', filter.Category);

        try {
          // Get category ID from category name
          const categoryResponse = await fetch(`${restApiUrl}/categories?search=${encodeURIComponent(filter.Category)}&per_page=20`);
          const categories = await categoryResponse.json();
          console.log('🔍 Category search results:', categories);

          // Find exact match (case insensitive)
          const matchedCategory = categories.find(cat =>
            cat.name.toLowerCase() === filter.Category.toLowerCase()
          );

          if (matchedCategory) {
            categoryId = matchedCategory.id;
            console.log('✅ Found category ID:', categoryId, 'for name:', matchedCategory.name);
          } else {
            console.log('❌ No exact category match found for:', filter.Category);
            console.log('📋 Available categories:', categories.map(c => c.name));
          }
        } catch (error) {
          console.error('❌ Error looking up category:', error);
        }
      }

      // Build published posts query parameters
      const publishedParams = new URLSearchParams({
        per_page: '100',
        status: 'publish',
        after: startOfDay,
        before: endOfDay,
        _embed: 'wp:term',
        categories_exclude: '6'
      });

      // Add category filter by ID if category found
      if (categoryId) {
        publishedParams.append('categories', categoryId.toString());
        console.log('🏷️ Added category ID filter to published query:', categoryId);
      }

      const publishedUrl = `${restApiUrl}/posts?${publishedParams}`;
      console.log('🔍 Fetching published posts from:', publishedUrl);
      console.log('📋 Published params:', Object.fromEntries(publishedParams));
      const publishedResponse = await fetch(publishedUrl);
      const publishedPosts = await publishedResponse.json();
      console.log('✅ Published posts response status:', publishedResponse.status);
      if (publishedResponse.status !== 200) {
        console.error('❌ Published posts error response:', publishedPosts);
      }

      // Build draft posts query parameters
      const draftParams = new URLSearchParams({
        per_page: '100',
        status: 'draft',
        after: startOfDay,
        before: endOfDay,
        _embed: 'wp:term'
      });

      // Add category filter by ID if category found
      if (categoryId) {
        draftParams.append('categories', categoryId.toString());
        console.log('🏷️ Added category ID filter to draft query:', categoryId);
      }

      // Category filtering is now handled above - same category ID used for both published and draft queries

      const draftUrl = `${restApiUrl}/posts?${draftParams}`;
      console.log('Fetching draft posts from:', draftUrl);
      const draftResponse = await fetch(draftUrl, {
        headers: authHeaders
      });
      const draftPosts = await draftResponse.json();
      console.log('Draft posts response status:', draftResponse.status);
      console.log("Draft API response:", draftResponse.status, draftPosts);

      console.log("published posts count:", publishedPosts?.length || 0);
      console.log("draft posts count:", draftPosts?.length || 0);

      // Process published posts
      if (Array.isArray(publishedPosts)) {
        console.log(`📝 === PROCESSING PUBLISHED POSTS ===`);
        console.log(`📊 Processing ${publishedPosts.length} published posts from API`);
        if (publishedPosts.length === 0) {
          console.log('⚠️ No published posts returned from API!');
        }

        publishedPosts.forEach((post, index) => {
          const categoryName = post._embedded?.['wp:term']?.[0]?.[0]?.name || "Uncategorized";
          console.log(`📄 Published ${index + 1}/${publishedPosts.length}: "${post.title.rendered}"`);
          console.log(`   📅 Post Date: ${post.date}`);
          console.log(`   🏷️ Category: ${categoryName}`);
          console.log(`   📊 Post ID: ${post.id}`);

          const decoded = decodeHtmlEntities(post.content.rendered);
          const plain = stripHtmlTags(decoded);

          datas.push({
            Id: post.id.toString(),
            Date: new Date(post.date).toLocaleDateString('en-US'),
            Category: categoryName,
            Title: post.title.rendered,
            Author: "Peoples Balita",
            Content: plain,
            Status: "Published"
          });
          console.log(`   ✅ ADDED to results: ${post.title.rendered}`);
        });
      } else {
        console.log('No published posts found or invalid response:', publishedPosts);
      }

      // Process draft posts
      if (Array.isArray(draftPosts)) {
        console.log(`📝 === PROCESSING DRAFT POSTS ===`);
        console.log(`📊 Processing ${draftPosts.length} draft posts from API`);
        if (draftPosts.length === 0) {
          console.log('⚠️ No draft posts returned from API!');
        }

        draftPosts.forEach((post, index) => {
          const categoryName = post._embedded?.['wp:term']?.[0]?.[0]?.name || "Uncategorized";
          console.log(`📝 Draft ${index + 1}/${draftPosts.length}: "${post.title.rendered}"`);
          console.log(`   📅 Post Date: ${post.date}`);
          console.log(`   🏷️ Category: ${categoryName}`);
          console.log(`   📊 Post ID: ${post.id}`);

          const decoded = decodeHtmlEntities(post.content.rendered);
          const plain = stripHtmlTags(decoded);

          datas.push({
            Id: post.id.toString(),
            Date: new Date(post.date).toLocaleDateString('en-US'),
            Category: categoryName,
            Title: post.title.rendered,
            Author: "Peoples Balita",
            Content: plain,
            Status: "Draft"
          });
          console.log(`   ✅ ADDED to results: ${post.title.rendered}`);
        });
      } else {
        console.log('No draft posts found or invalid response:', draftPosts);
      }

    } catch (error) {
      console.error("Error fetching posts:", error);
    }

    console.log('🏁 === FINAL RESULTS ===');
    console.log('📊 Total posts returned:', datas.length);
    console.log('📝 Posts summary:', datas.map(d => `${d.Title} (${d.Category}) - ${d.Status}`));
    return datas;
  }
  interface IUploadToFacebook {
    id: string;
    status: string;
  }
  export const postAll = async (filter: FilterDto) => {
    const dateToday = new Date();
    const datas = await getAllData(filter);
    console.log(datas);

    // Filter by selected post IDs if provided
    const postsToProcess = filter.selectedPostIds
      ? datas.filter(data => filter.selectedPostIds!.includes(data.Id))
      : datas;

    console.log('Posts to process:', postsToProcess);
    const results: IUploadToFacebook[] = [];

    for (const data of postsToProcess) {
      try {
        const result = await uploadToFacebookById(data.Id);
        if (result === 'ok') {
          results.push({ id: data.Id, status: 'success' });
        } else {
          results.push({ id: data.Id, status: 'failed' });
        }
      } catch (error) {
        console.error(`Failed to upload post with ID ${data.Id}:`, error);
        results.push({ id: data.Id, status: 'failed' });
      }
    }

    return results;
  }

  export const publishAllDrafts = async (filter: FilterDto) => {
    const restApiUrl = `${import.meta.env.VITE_WORDPRESS_BASE_URL}/wp-json/wp/v2`;
    const authHeaders = {
      'Authorization': `Basic ${btoa(`${import.meta.env.VITE_WP_APP_USERNAME}:${import.meta.env.VITE_WP_APP_PASSWORD}`)}`,
      'Content-Type': 'application/json'
    };

    // Use exact 00:00 format for draft posts too
    const dateStr = dayjs(filter.Date).format('YYYY-MM-DD');
    const startOfDay = `${dateStr}T00:00:00`;
    const endOfDay = `${dateStr}T23:59:59`;

    console.log('PublishAllDrafts - Date range (local):', startOfDay, 'to', endOfDay);

    // Get all draft posts for the filtered date
    const draftParams = new URLSearchParams({
      per_page: '100',
      status: 'draft',
      after: startOfDay,
      before: endOfDay
    });

    if (filter.Category) {
      const categoriesResponse = await fetch(`${restApiUrl}/categories?name=${encodeURIComponent(filter.Category)}`);
      const categories = await categoriesResponse.json();
      if (categories.length > 0) {
        draftParams.set('categories', categories[0].id);
      }
    }

    try {
      const draftResponse = await fetch(`${restApiUrl}/posts?${draftParams}`, {
        headers: authHeaders
      });
      const draftPosts = await draftResponse.json();

      console.log(`Found ${draftPosts.length} draft posts to publish`);

      // Log each draft post with its timestamp
      draftPosts.forEach(post => {
        console.log(`Draft to publish: ${post.title.rendered} - Date: ${post.date} - Time: ${new Date(post.date).toLocaleTimeString()}`);
      });

      const results = [];

      // Filter by selected post IDs if provided
      const postsToPublish = filter.selectedPostIds
        ? draftPosts.filter(post => filter.selectedPostIds!.includes(post.id.toString()))
        : draftPosts;

      console.log(`Posts to publish: ${postsToPublish.length} out of ${draftPosts.length} drafts`);

      // Update each draft post to published status
      for (const post of postsToPublish) {
        try {
          const updateResponse = await fetch(`${restApiUrl}/posts/${post.id}`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              status: 'publish'
            })
          });

          if (updateResponse.ok) {
            results.push({ id: post.id, status: 'success', title: post.title.rendered });
            console.log(`Published: ${post.title.rendered}`);
          } else {
            results.push({ id: post.id, status: 'failed', title: post.title.rendered });
            console.error(`Failed to publish: ${post.title.rendered}`);
          }
        } catch (error) {
          console.error(`Error publishing post ${post.id}:`, error);
          results.push({ id: post.id, status: 'failed', title: post.title.rendered });
        }
      }

      return results;
    } catch (error) {
      console.error("Error fetching draft posts:", error);
      return [];
    }
  };

  export const publishDraftById = async (id: string): Promise<string> => {
    const restApiUrl = `${import.meta.env.VITE_WORDPRESS_BASE_URL}/wp-json/wp/v2`;
    const authHeaders = {
      'Authorization': `Basic ${btoa(`${import.meta.env.VITE_WP_APP_USERNAME}:${import.meta.env.VITE_WP_APP_PASSWORD}`)}`,
      'Content-Type': 'application/json'
    };

    try {
      const updateResponse = await fetch(`${restApiUrl}/posts/${id}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'publish'
        })
      });

      if (updateResponse.ok) {
        const updatedPost = await updateResponse.json();
        console.log(`Published post: ${updatedPost.title.rendered}`);
        return 'success';
      } else {
        console.error(`Failed to publish post with ID ${id}:`, updateResponse.statusText);
        return 'failed';
      }
    } catch (error) {
      console.error(`Error publishing post ${id}:`, error);
      return 'failed';
    }
  };

  export const generateFacebookShareUrl = async (id: string): Promise<string>  => {
    try {
      console.log('=== GENERATING FACEBOOK SHARE URL ===');
      console.log('Post ID:', id);

      // Get basic post data
      const {linkOfPost, titleOfPost} = await getDataById(id);
      console.log('Post title:', titleOfPost);
      console.log('Post link:', linkOfPost);

      if (!linkOfPost || !titleOfPost) {
        throw new Error('Missing post data: title or link is empty');
      }

      // Generate Facebook share URL
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkOfPost)}&quote=${encodeURIComponent(titleOfPost)}`;
      console.log('Generated share URL:', shareUrl);

      return shareUrl;
    } catch (error) {
      console.error('=== FACEBOOK SHARE URL ERROR ===');
      console.error('Error generating Facebook share URL:', error);
      console.error('Post ID:', id);
      return '';
    }
  };

  export const uploadToFacebookById = async (id: string): Promise<string>  => {
    try {
      console.log('=== FACEBOOK UPLOAD DEBUG (Using Pages API) ===');
      console.log('Uploading post ID:', id);

      // Get basic post data
      const {linkOfPost, titleOfPost} = await getDataById(id);
      console.log('Post title:', titleOfPost);
      console.log('Post link:', linkOfPost);

      // Get detailed post data including attachments
      const postDetails = await getPostDetailsWithAttachments(id);
      console.log('Post details:', postDetails);

      let token = import.meta.env.VITE_LONG_LIVED_ACCESS_TOKEN;
      const pageId = '123281457540260';

      console.log('Facebook token available:', !!token);
      console.log('Page ID:', pageId);

      if (!token) {
        throw new Error('Facebook access token not found in environment variables');
      }

      if (!linkOfPost || !titleOfPost) {
        throw new Error('Missing post data: title or link is empty');
      }

      // Check if post has image attachments - ONLY ALLOW POSTS WITH IMAGES
      if (!postDetails.images || postDetails.images.length === 0) {
        console.log('❌ POST REJECTED: No images found - only articles with images are allowed for Facebook posting');
        throw new Error('Post rejected: Only articles with images are allowed to be posted to Facebook');
      }

      console.log('✅ Post has images, proceeding with Facebook upload');
      console.log('Images found:', postDetails.images);

      const imageUrl = postDetails.images[0]; // Use first image
      console.log('Using image URL:', imageUrl);

      // Use Facebook Pages API v23.0 to post photo directly to page
      const photoUploadUrl = `https://graph.facebook.com/v23.0/${pageId}/photos`;

      try {
        console.log('Uploading photo to Facebook page...');
        console.log('Upload URL:', photoUploadUrl);

        // Download image using CORS proxy to avoid browser restrictions
        console.log('Downloading image through proxy:', imageUrl);

        // Use the server-side proxy endpoint to fetch the image
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}&auth=true`;
        console.log('Proxy URL:', proxyUrl);

        const imageResponse = await fetch(proxyUrl);

        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status} - ${imageResponse.statusText}`);
        }

        const imageBlob = await imageResponse.blob();
        console.log('=== IMAGE VALIDATION ===');
        console.log('Image downloaded successfully');
        console.log('Size:', imageBlob.size, 'bytes');
        console.log('Type:', imageBlob.type);
        console.log('Valid size (>0):', imageBlob.size > 0);
        console.log('Valid type (image/*):', imageBlob.type.startsWith('image/'));

        // Validate image
        if (imageBlob.size === 0) {
          throw new Error('Downloaded image has zero size');
        }

        if (!imageBlob.type.startsWith('image/')) {
          throw new Error(`Invalid image type: ${imageBlob.type}. Expected image/* format.`);
        }

        // Facebook supports: JPEG, PNG, GIF, BMP, TIFF, WebP
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
        if (!supportedTypes.includes(imageBlob.type.toLowerCase())) {
          console.warn(`Image type ${imageBlob.type} may not be supported by Facebook. Supported types:`, supportedTypes);
        }

        // Size limits - Facebook recommends images be at least 1200x630 pixels and under 8MB
        const maxSize = 8 * 1024 * 1024; // 8MB
        if (imageBlob.size > maxSize) {
          throw new Error(`Image too large: ${imageBlob.size} bytes. Maximum allowed: ${maxSize} bytes (8MB).`);
        }

        // Determine filename from URL or content type
        let filename = 'image.jpg';
        try {
          const urlPath = new URL(imageUrl).pathname;
          const urlFilename = urlPath.split('/').pop();
          if (urlFilename && urlFilename.includes('.')) {
            filename = urlFilename;
          }
        } catch (e) {
          // Use content type to determine extension
          if (imageBlob.type.includes('png')) {
            filename = 'image.png';
          } else if (imageBlob.type.includes('gif')) {
            filename = 'image.gif';
          } else if (imageBlob.type.includes('webp')) {
            filename = 'image.webp';
          } else if (imageBlob.type.includes('jpeg') || imageBlob.type.includes('jpg')) {
            filename = 'image.jpg';
          }
        }

        console.log('Using filename:', filename);
        console.log('=== PREPARING FACEBOOK UPLOAD ===');

        // Create FormData for binary upload
        const formData = new FormData();
        formData.append('source', imageBlob, filename); // Use binary upload with proper filename
        formData.append('caption', `${titleOfPost}\n\nRead more: ${linkOfPost}`);
        formData.append('published', 'true');
        formData.append('access_token', token);

        console.log('FormData prepared:');
        console.log('- Image file size:', imageBlob.size);
        console.log('- Image file type:', imageBlob.type);
        console.log('- Filename:', filename);
        console.log('- Caption length:', `${titleOfPost}\n\nRead more: ${linkOfPost}`.length);

        const photoResponse = await fetch(photoUploadUrl, {
          method: 'POST',
          body: formData // Use FormData instead of URLSearchParams
        });

        console.log('Facebook upload response status:', photoResponse.status);
        console.log('Facebook response headers:', Object.fromEntries(photoResponse.headers.entries()));

        if (!photoResponse.ok) {
          const errorText = await photoResponse.text();
          console.error('Facebook API error response:', errorText);

          try {
            const errorJson = JSON.parse(errorText);
            console.error('Parsed Facebook error:', errorJson);

            // Check for specific error codes
            if (errorJson.error && errorJson.error.code === 200) {
              throw new Error(`Permission Error: ${errorJson.error.message}\n\nRequired permissions: pages_manage_posts, pages_read_engagement, pages_show_list`);
            } else if (errorJson.error && errorJson.error.code === 324) {
              // Try fallback method: convert to JPEG and retry
              console.log('=== TRYING FALLBACK METHOD ===');
              console.log('Converting image to JPEG format and retrying...');

              try {
                // Create a canvas to convert the image to JPEG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Create an image element to load the blob
                const img = new Image();
                const imageDataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(imageBlob);
                });

                await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                  img.src = imageDataUrl;
                });

                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image on canvas
                ctx.drawImage(img, 0, 0);

                // Convert to JPEG blob
                const jpegBlob = await new Promise(resolve => {
                  canvas.toBlob(resolve, 'image/jpeg', 0.9);
                });

                console.log('Converted to JPEG:', jpegBlob.size, 'bytes, type:', jpegBlob.type);

                // Retry with JPEG
                const fallbackFormData = new FormData();
                fallbackFormData.append('source', jpegBlob, 'converted-image.jpg');
                fallbackFormData.append('caption', `${titleOfPost}\n\nRead more: ${linkOfPost}`);
                fallbackFormData.append('published', 'true');
                fallbackFormData.append('access_token', token);

                console.log('Retrying with converted JPEG...');
                const fallbackResponse = await fetch(photoUploadUrl, {
                  method: 'POST',
                  body: fallbackFormData
                });

                if (fallbackResponse.ok) {
                  const fallbackResult = await fallbackResponse.json();
                  console.log('Fallback JPEG upload successful:', fallbackResult);
                  return 'ok';
                } else {
                  const fallbackError = await fallbackResponse.text();
                  console.error('Fallback upload also failed:', fallbackError);
                }

              } catch (conversionError) {
                console.error('Image conversion failed:', conversionError);
              }

              throw new Error(`Image Error: ${errorJson.error.message}\n\nThe image could not be processed by Facebook. Tried multiple formats but all failed. Please try with a different image.`);
            }
          } catch (parseError) {
            console.error('Could not parse Facebook error as JSON');
          }

          throw new Error(`Photo upload failed: ${photoResponse.status} - ${errorText}`);
        }

        const photoResult = await photoResponse.json();
        console.log('Photo posted successfully to page:', photoResult);

        return 'ok';
      } catch (imageError) {
        console.error('Error in image upload process:', imageError);
        throw imageError;
      }
    } catch (error) {
      console.error('=== FACEBOOK UPLOAD ERROR ===');
      console.error('Error uploading to Facebook:', error);
      console.error('Post ID:', id);
      console.error('=== END ERROR DEBUG ===');
      return 'error';
    }
  };

  const getPostDetailsWithAttachments = async (id: string) => {
    console.log('=== GETTING POST ATTACHMENTS ===');
    console.log('Fetching attachments for post ID:', id);

    const restApiUrl = `${import.meta.env.VITE_WORDPRESS_BASE_URL}/wp-json/wp/v2`;
    const authHeaders = {
      'Authorization': `Basic ${btoa(`${import.meta.env.VITE_WP_APP_USERNAME}:${import.meta.env.VITE_WP_APP_PASSWORD}`)}`
    };

    try {
      // Fetch post details with embedded media
      const response = await fetch(`${restApiUrl}/posts/${id}?_embed`, {
        headers: authHeaders
      });

      console.log('WordPress API response status:', response.status);

      if (response.ok) {
        const postData = await response.json();
        console.log('Post embedded data:', postData._embedded);

        const images = [];

        // Get featured image
        if (postData._embedded && postData._embedded['wp:featuredmedia']) {
          console.log('Found featured media:', postData._embedded['wp:featuredmedia']);
          const featuredImage = postData._embedded['wp:featuredmedia'][0];
          if (featuredImage && featuredImage.source_url) {
            console.log('Adding featured image:', featuredImage.source_url);
            images.push(featuredImage.source_url);
          }
        } else {
          console.log('No featured media found');
        }

        // Get additional image attachments
        if (postData._embedded && postData._embedded['wp:attachment']) {
          console.log('Found attachments:', postData._embedded['wp:attachment']);
          const imageAttachments = postData._embedded['wp:attachment']
            .filter((attachment: any) => attachment.mime_type.startsWith('image/'))
            .map((attachment: any) => attachment.source_url);

          console.log('Image attachments:', imageAttachments);
          images.push(...imageAttachments);
        } else {
          console.log('No attachments found');
        }

        const finalImages = [...new Set(images)]; // Remove duplicates
        console.log('Final images array:', finalImages);

        return {
          images: finalImages,
          title: postData.title?.rendered || '',
          content: postData.content?.rendered || '',
          link: postData.link || ''
        };
      } else {
        console.error('Failed to fetch post details');
        return { images: [], title: '', content: '', link: '' };
      }
    } catch (error) {
      console.error('Error fetching post details with attachments:', error);
      return { images: [], title: '', content: '', link: '' };
    }
  };

  const getDataById = async (id: string) => {
    console.log("Fetching post data for ID: ", id);

    const restApiUrl = `${import.meta.env.VITE_WORDPRESS_BASE_URL}/wp-json/wp/v2`;
    const authHeaders = {
      'Authorization': `Basic ${btoa(`${import.meta.env.VITE_WP_APP_USERNAME}:${import.meta.env.VITE_WP_APP_PASSWORD}`)}`
    };

    try {
      const response = await fetch(`${restApiUrl}/posts/${id}`, {
        headers: authHeaders
      });

      if (response.ok) {
        const postData = await response.json();
        return {
          linkOfPost: postData.link,
          titleOfPost: postData.title.rendered
        };
      } else {
        console.error(`Failed to fetch post with ID ${id}:`, response.statusText);
        return {
          linkOfPost: '',
          titleOfPost: ''
        };
      }
    } catch (error) {
      console.error(`Error fetching post data for ID ${id}:`, error);
      return {
        linkOfPost: '',
        titleOfPost: ''
      };
    }
  }