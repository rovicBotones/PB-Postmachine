import type { Route } from "./+types/_layout.add-article";
import { isAuthenticated } from "utils/auth.service";
import { toast } from "sonner";
import { redirect } from "react-router";
import { useState, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { X, Upload, Plus } from "lucide-react";

export async function clientLoader({
  params, request
}: Route.ClientLoaderArgs) {
    const isLoggedIn = await isAuthenticated();
    if (!isLoggedIn) {
      toast('My first toast');
      return redirect("/");
    }
}

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

interface ArticleForm {
  id: string;
  title: string;
  body: string;
  category: string;
  date: string;
  attachments: File[];
  attachmentFields: number;
  tabloidImage: File | null;
}

interface DragDropZoneProps {
  onFilesChange: (file: File | null, index: number) => void;
  onRemoveField?: (index: number) => void;
  file: File | null;
  index: number;
  canRemoveField?: boolean;
}

function DragDropZone({ onFilesChange, onRemoveField, file, index, canRemoveField }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const validateFile = useCallback((file: File) => {
    if (!file) {
      return false;
    }

    // Check MIME type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const fileType = file.type ? file.type.toLowerCase() : '';
    const isValidMimeType = validMimeTypes.includes(fileType);

    // Check file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    // Strict validation: reject if file doesn't match expected format
    if (!isValidMimeType || !hasValidExtension) {
      toast.error(`"${file.name}" is not a valid image format. Only JPG, JPEG, and PNG files are allowed.`);
      return false;
    }

    // Check file size (5MB limit)
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 5) {
      toast.error(`"${file.name}" is too large. Maximum file size is 5MB.`);
      return false;
    }

    return true;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];

      if (validateFile(droppedFile)) {
        onFilesChange(droppedFile, index);
      }
    }
  }, [onFilesChange, index, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (validateFile(selectedFile)) {
        onFilesChange(selectedFile, index);
      } else {
        // Clear the input so user can select the same file again after seeing the error
        e.target.value = '';
      }
    }
  }, [onFilesChange, index, validateFile]);

  const removeFile = useCallback(() => {
    onFilesChange(null, index);
  }, [onFilesChange, index]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop an image here, or click to select
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Only JPG, JPEG, and PNG files are accepted (Max: 5MB)
        </p>
        <input
          type="file"
          onChange={handleFileInput}
          className="hidden"
          id={`file-upload-${index}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
        >
          Select File
        </Button>
      </div>

      {file && (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-muted p-2 rounded">
            <span className="text-sm truncate">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-muted-foreground hover:text-destructive"
              title="Remove this file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {previewUrl && (
            <div className="relative w-20 h-20">
              <img
                src={previewUrl}
                alt={file.name}
                className="w-full h-full object-cover rounded border"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleFormComponent({
  form,
  onUpdate,
  onRemove,
  canRemove,
  wpCategories,
  categoriesLoading
}: {
  form: ArticleForm;
  onUpdate: (id: string, updates: Partial<ArticleForm>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  wpCategories: WordPressCategory[];
  categoriesLoading: boolean;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Article Form</CardTitle>
        {canRemove && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(form.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`title-${form.id}`}>
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`title-${form.id}`}
            value={form.title}
            onChange={(e) => onUpdate(form.id, { title: e.target.value })}
            placeholder="Enter article title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`body-${form.id}`}>
            Body <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id={`body-${form.id}`}
            value={form.body}
            onChange={(e) => onUpdate(form.id, { body: e.target.value })}
            placeholder="Write your article content here..."
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`category-${form.id}`}>
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.category}
            onValueChange={(value) => onUpdate(form.id, { category: value })}
            disabled={categoriesLoading}
          >
            <SelectTrigger id={`category-${form.id}`}>
              <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
            </SelectTrigger>
            <SelectContent>
              {wpCategories.length > 0 ? (
                wpCategories.map((category) => (
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
          <Label htmlFor={`date-${form.id}`}>
            Publish Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`date-${form.id}`}
            type="datetime-local"
            value={form.date}
            onChange={(e) => onUpdate(form.id, { date: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Timezone: UTC+8 (Asia/Manila, Asia/Singapore, etc.)
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Attachment</Label>
            {/* <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdate(form.id, { attachmentFields: form.attachmentFields + 1 })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Attachment
            </Button> */}
          </div>

          {Array.from({ length: form.attachmentFields }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                {/* <Label className="text-sm text-muted-foreground">Attac</Label> */}
                {form.attachmentFields > 1 && !form.attachments[index] && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newAttachments = [...form.attachments];
                      newAttachments.splice(index, 1);
                      onUpdate(form.id, {
                        attachments: newAttachments,
                        attachmentFields: form.attachmentFields - 1
                      });
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    title="Remove this attachment field"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <DragDropZone
                onFilesChange={(file, idx) => {
                  const newAttachments = [...form.attachments];
                  if (file) {
                    newAttachments[idx] = file;
                  } else {
                    newAttachments.splice(idx, 1);
                  }
                  onUpdate(form.id, { attachments: newAttachments });
                }}
                file={form.attachments[index] || null}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Tabloid Image for Showbiz category */}
        {(() => {
          const selectedCategoryId = parseInt(form.category);
          const selectedCategory = wpCategories.find(cat => cat.id === selectedCategoryId);
          const categoryName = selectedCategory?.name || '';
          return categoryName === 'Showbiz';
        })() && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Tabloid Image <span className="text-red-500">*</span>
              </Label>
            </div>
            <div className="space-y-2">
              <DragDropZone
                onFilesChange={(file) => {
                  onUpdate(form.id, { tabloidImage: file });
                }}
                file={form.tabloidImage || null}
                index={-1} // Use -1 for tabloid image
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get current date/time in UTC+8
const getCurrentDateTimeUTC8 = () => {
  return new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().slice(0, 16);
};

// Helper function to convert datetime-local to UTC+8 ISO string
const convertToUTC8ISO = (dateTimeLocal: string) => {
  return new Date(dateTimeLocal + '+08:00').toISOString();
};

export default function AddArticle() {
  const [forms, setForms] = useState<ArticleForm[]>([
    {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      category: "",
      date: getCurrentDateTimeUTC8(), // Current date/time in UTC+8
      attachments: [],
      attachmentFields: 1,
      tabloidImage: null
    }
  ]);

  const [wpCategories, setWpCategories] = useState<WordPressCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch WordPress categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;
        const wpUsername = import.meta.env.VITE_WP_APP_USERNAME || 'admin';
        const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL || 'https://your-wordpress-site.com';

        if (!wpPassword) {
          console.warn('WordPress credentials not configured, using default categories');
          setCategoriesLoading(false);
          return;
        }

        const authString = btoa(`${wpUsername}:${wpPassword}`);
        const authHeader = `Basic ${authString}`;

        const response = await fetch(`${wpBaseUrl}/wp-json/wp/v2/categories?per_page=100`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
          },
        });

        if (response.ok) {
          const categories = await response.json();
          setWpCategories(categories);
        } else {
          console.error('Failed to fetch categories:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const addForm = () => {
    const newForm: ArticleForm = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      category: "",
      date: getCurrentDateTimeUTC8(),
      attachments: [],
      attachmentFields: 1,
      tabloidImage: null
    };
    setForms([...forms, newForm]);
  };

  const updateForm = (id: string, updates: Partial<ArticleForm>) => {
    setForms(forms.map(form =>
      form.id === id ? { ...form, ...updates } : form
    ));
  };

  const removeForm = (id: string) => {
    setForms(forms.filter(form => form.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate forms
    const invalidForms = forms.filter(form => {
      // Basic validation
      if (!form.title.trim() || !form.body.trim() || !form.category || !form.date) {
        return true;
      }

      // Check if Showbiz category requires tabloid image
      const selectedCategoryId = parseInt(form.category);
      const selectedCategory = wpCategories.find(cat => cat.id === selectedCategoryId);
      const categoryName = selectedCategory?.name || '';

      if (categoryName === 'Showbiz' && !form.tabloidImage) {
        return true;
      }

      return false;
    });

    if (invalidForms.length > 0) {
      // Check if any Showbiz forms are missing tabloid image
      const showbizFormsWithoutTabloid = forms.filter(form => {
        const selectedCategoryId = parseInt(form.category);
        const selectedCategory = wpCategories.find(cat => cat.id === selectedCategoryId);
        const categoryName = selectedCategory?.name || '';
        return categoryName === 'Showbiz' && !form.tabloidImage;
      });

      if (showbizFormsWithoutTabloid.length > 0) {
        toast.error("Tabloid Image is required for Showbiz category");
      } else {
        toast.error("Please fill in all required fields for all forms");
      }
      return;
    }

    try {
      toast.info("Submitting articles to WordPress...");

      const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;
      const wpUsername = import.meta.env.VITE_WP_APP_USERNAME || 'admin';
      const wpBaseUrl = import.meta.env.VITE_WORDPRESS_BASE_URL || 'https://your-wordpress-site.com';

      if (!wpPassword) {
        throw new Error('WordPress Application Password not configured');
      }

      // Create Basic Auth header for Application Password
      const authString = btoa(`${wpUsername}:${wpPassword}`);
      const authHeader = `Basic ${authString}`;

      for (const form of forms) {
        // First, upload media files if any
        const mediaIds: number[] = [];
        let tabloidImageId: number | null = null;

        // Upload regular attachments
        for (const file of form.attachments) {
          const mediaFormData = new FormData();
          mediaFormData.append('file', file);

          const mediaResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
            },
            body: mediaFormData
          });

          if (mediaResponse.ok) {
            const mediaResult = await mediaResponse.json();
            mediaIds.push(mediaResult.id);
          }
        }

        // Upload tabloid image if exists (for Showbiz category)
        if (form.tabloidImage) {
          const tabloidFormData = new FormData();
          tabloidFormData.append('file', form.tabloidImage);

          const tabloidResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
            },
            body: tabloidFormData
          });

          if (tabloidResponse.ok) {
            const tabloidResult = await tabloidResponse.json();
            tabloidImageId = tabloidResult.id;
            console.log(`Tabloid image uploaded with ID: ${tabloidImageId}`);
          }
        }

        // Create the post first
        const postData = {
          title: form.title,
          content: form.body,
          status: 'draft',
          categories: [parseInt(form.category)],
          date: convertToUTC8ISO(form.date), // Convert to UTC+8 and then to ISO string for WordPress
          featured_media: mediaIds[0] || undefined, // Set first attachment as featured image
        };

        const response = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });

        if (!response.ok) {
          throw new Error(`Failed to create post: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Post created:`, result);

        // Add custom fields if we have images
        if (mediaIds.length > 0 || tabloidImageId) {
          const postId = result.id;

          // Set article_thumb from first regular attachment
          if (mediaIds.length > 0) {
            const firstMediaId = mediaIds[0];
            // Get the media details to extract the URL
            const mediaDetailsResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/media/${firstMediaId}`, {
              method: 'GET',
              headers: {
                'Authorization': authHeader,
              },
            });

            if (mediaDetailsResponse.ok) {
              const mediaDetails = await mediaDetailsResponse.json();
              const imageUrl = mediaDetails.source_url;

              // Set article_thumb
              console.log(`Setting article_thumb for post ${postId} to: ${imageUrl}`);

              try {
                const articleThumbResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${postId}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    meta: {
                      article_thumb: imageUrl
                    }
                  })
                });

                if (articleThumbResponse.ok) {
                  const result = await articleThumbResponse.json();
                  console.log(`✅ article_thumb set successfully:`, result.meta?.article_thumb);
                } else {
                  const errorText = await articleThumbResponse.text();
                  console.error(`❌ Failed to set article_thumb: ${articleThumbResponse.status}`, errorText);
                }
              } catch (error) {
                console.error('Error setting article_thumb:', error);
              }
            }
          }

          // Set tabloid_image custom field if tabloid image exists
          if (tabloidImageId) {
            const tabloidDetailsResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/media/${tabloidImageId}`, {
              method: 'GET',
              headers: {
                'Authorization': authHeader,
              },
            });

            if (tabloidDetailsResponse.ok) {
              const tabloidDetails = await tabloidDetailsResponse.json();
              const tabloidUrl = tabloidDetails.source_url;

              console.log(`Setting tabloid_image for post ${postId} to: ${tabloidUrl}`);

              try {
                const tabloidResponse = await fetch(`${wpBaseUrl}/wp-json/wp/v2/posts/${postId}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    meta: {
                      tabloid_image: tabloidUrl
                    }
                  })
                });

                if (tabloidResponse.ok) {
                  const result = await tabloidResponse.json();
                  console.log(`✅ tabloid_image set successfully:`, result.meta?.tabloid_image);
                } else {
                  const errorText = await tabloidResponse.text();
                  console.error(`❌ Failed to set tabloid_image: ${tabloidResponse.status}`, errorText);
                }
              } catch (error) {
                console.error('Error setting tabloid_image:', error);
              }
            }
          }
        }
      }

      toast.success(`Successfully submitted ${forms.length} article${forms.length > 1 ? 's' : ''}!`);

      // Reset forms after successful submission
      setForms([{
        id: crypto.randomUUID(),
        title: "",
        body: "",
        category: "",
        date: getCurrentDateTimeUTC8(),
        attachments: [],
        attachmentFields: 1,
        tabloidImage: null
      }]);

    } catch (error) {
      console.error('Error submitting to WordPress:', error);
      toast.error("Failed to submit articles to WordPress. Please try again.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Add Articles</h1>
          <p className="text-muted-foreground mt-2">
            Create one or more articles with attachments
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {forms.map((form, index) => (
            <ArticleFormComponent
              key={form.id}
              form={form}
              onUpdate={updateForm}
              onRemove={removeForm}
              canRemove={forms.length > 1 && index > 0}
              wpCategories={wpCategories}
              categoriesLoading={categoriesLoading}
            />
          ))}

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={addForm}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Article
            </Button>

            <Button type="submit" className="flex items-center gap-2">
              Submit All Articles
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 