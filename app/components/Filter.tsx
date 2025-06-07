import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "~/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams } from "react-router";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { selectRowsFn } from "@tanstack/react-table";
type FilterDto = {
    Date: Date | undefined;
    Category: string;
    Title: string;
  }
const Filter = () => {
  let [date, setDate] = React.useState<Date | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const dateToday = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
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
    const form = e.currentTarget;
    const formData = new FormData(form);
    const filter: FilterDto = {
      Date: formData.get("date") ? new Date(formData.get("date") as string) : undefined,
      Category: formData.get("category") as string,
      Title: formData.get("title") as string,
    };
    if(filter.Category === "-"){
      filter.Category = "";
    }
    await updateFilter(filter);
  };
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
    <div className="p-2 grid">
      <div className="bg-gray-100 p-4 rounded-lg shadow-md ">
        <h2 className="text-lg font-semibold mb-4"></h2>
        
        <form className="mb-4 grid grid-cols-4 gap-4" onSubmit={handleSubmit}>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input type="date" id="date" name="date" placeholder="Date" defaultValue={dateToday} />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5" >
            <Label htmlFor="category">Category</Label>
            {/* <Input type="text" id="category" name="category" placeholder="Category" /> */}
            <Select name="category">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="-">Select Category</SelectItem>
                  {selections.map((selection) => (
                    <SelectItem key={selection.id} value={selection.name}>
                      {selection.name}
                    </SelectItem> 
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5" hidden>
            <Label htmlFor="title">Title</Label>
            <Input type="text" id="title" name="title" placeholder="Title" />
          </div>
          <div></div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Button type="submit" className="mt-5" variant={"outline"}>
              Filter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Filter;