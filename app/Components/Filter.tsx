import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "~/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const Filter = () => {
    let [date, setDate] = React.useState<Date | undefined>(undefined);
  return (
    <div className="p-2 grid mx-100">
        <div className="bg-gray-100 p-4 rounded-lg shadow-md ">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="mb-4 grid grid-cols-4 gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input type="date" id="date" placeholder="Date" />
                    
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="category">Category</Label>
                <Input type="text" id="category" placeholder="Category" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input type="text" id="title" placeholder="Title" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                <Button className="mt-5" variant={"outline"}>Filter</Button>
                </div>
            </div>


            
            </div>
    </div>
    
  );
};

export default Filter;