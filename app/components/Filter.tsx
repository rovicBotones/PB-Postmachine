import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "~/lib/utils";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { selectRowsFn } from "@tanstack/react-table";
import { getAllCategories } from "utils/posts.service";
type FilterDto = {
    Date: Date | undefined;
    Category: string;
    Title: string;
  }
const Filter = () => {
  let [date, setDate] = React.useState<Date | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<{id: number, name: string, slug: string, count: number}[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const navigate = useNavigate();
  const dateToday = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Get current filter values from URL parameters
  const currentDateParam = searchParams.get("date");
  const currentCategoryParam = searchParams.get("category");
  const currentTitleParam = searchParams.get("title");

  // Set default date value based on URL parameter or today's date
  const defaultDateValue = currentDateParam || dateToday;
  const updateFilter = async (filter: FilterDto) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (filter.Date) next.set("date", filter.Date.toISOString().slice(0, 10));
      if (filter.Category) next.set("category", filter.Category);
      if (filter.Title) next.set("title", filter.Title);
      if(!filter.Date) next.delete("date");
      if(filter.Category === "") {
        next.delete("category");
      }
      if(filter.Title === "") {
        next.delete("title");
      }
      return next;
    });
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsApplyingFilter(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const filter: FilterDto = {
        Date: formData.get("date") ? new Date(formData.get("date") as string) : undefined,
        Category: selectedCategory === "-" ? "" : selectedCategory,
        Title: formData.get("title") as string,
      };

      await updateFilter(filter);

      // Add a small delay to show loading state
      setTimeout(() => {
        setIsApplyingFilter(false);
      }, 500);
    } catch (error) {
      console.error('Error applying filter:', error);
      setIsApplyingFilter(false);
    }
  };

  const handleResetFilter = () => {
    // Clear all search parameters and reset category state
    setSelectedCategory("");
    navigate('/home', { replace: true });
  };

  // Load categories from WordPress API and set initial category value from URL
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const fetchedCategories = await getAllCategories();// to lower each
        const lowerCategories = fetchedCategories.map(({ name, ...category }) => ({
          ...category,
          name: (name as string).toLowerCase()
        }))
        console.log('Fetched categories:', lowerCategories);
        setCategories(lowerCategories);

        // Set initial category value from URL parameters if present
        if (currentCategoryParam) {
          setSelectedCategory(currentCategoryParam.toLowerCase());
          console.log('Set initial category from URL:', currentCategoryParam);
        } else {
          setSelectedCategory(""); // Default to "All Categories"
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, [currentCategoryParam]); // Re-run when URL category parameter changes
  const selections = [
    {
      id: 0,
      name: 'Showbiz'
    },
    {
      id: 1,
      name: 'Contributors'
    },
    {
      id: 2,
      name: 'Sports'

    },
    {
      id: 3,
      name: 'Headlines'
    },
    {
      id: 4,
      name: 'Subheadlines'
    },
    {
      id: 5,
      name: 'Libangan'
    },
    {
      id: 6,
      name: 'Editorial'
    },
    {
      id: 7,
      name: 'Classified Ads'
    }
  ]
  
  return (
    <div className="mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Input Fields Row */}
          <div className="flex flex-col sm:flex-row lg:grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {/* Date Field */}
            <div className="w-full min-w-0">
              <Label htmlFor="date" className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 block">
                Date
              </Label>
              <Input
                type="date"
                id="date"
                name="date"
                defaultValue={defaultDateValue}
                className="w-full h-9 sm:h-10 text-sm"
              />
            </div>

            {/* Category Field */}
            <div className="w-full min-w-0">
              <Label htmlFor="category" className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 block">
                Category
              </Label>
              <Select
                name="category"
                value={selectedCategory || "-"}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger className="w-full h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  <SelectGroup>
                    <SelectItem value="-" className="text-sm">All Categories</SelectItem>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled className="text-sm">Loading categories...</SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.name} className="text-sm">
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Hidden Title Field */}
            <div className="hidden">
              <Input
                type="text"
                id="title"
                name="title"
                placeholder="Title"
                defaultValue={currentTitleParam || ""}
              />
            </div>
          </div>

          {/* Filter Buttons - Bottom Row */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="submit"
              variant="default"
              disabled={isApplyingFilter}
              className="h-9 sm:h-10 px-6 sm:px-8 text-sm font-medium"
            >
              {isApplyingFilter ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                'Apply Filter'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              disabled={isApplyingFilter}
              className="h-9 sm:h-10 px-4 sm:px-6 text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Filter;