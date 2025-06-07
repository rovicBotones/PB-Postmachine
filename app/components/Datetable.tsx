import { type News } from "~/routes/_layout.home";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table";
import { LiaFacebookSquare  } from "react-icons/lia";
import dayjs from "dayjs";
import { Link } from "react-router";
import { useNavigation, useFetcher } from "react-router";
import type { ClientRequestArgs } from "http";
import { uploadToFacebookById } from "utils/posts.service";
import { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { SiGooglesearchconsole } from "react-icons/si";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { toast } from "sonner";

const columnHelper = createColumnHelper<News>()

const columns = [
  columnHelper.accessor('Date', {
    footer: info => info.column.id,
    cell: (info) => {
      return <span className="pr-5 pl-1">{dayjs(info.getValue()).format('MMMM D, YYYY')}</span>
    },
  }),
  columnHelper.accessor('Category', {
    cell: (info: any) => {
      return <span className="pr-5 pl-1">{info.getValue()}</span>
    },
    footer: info => info.column.id,
  }),
  columnHelper.accessor(row => row.Title, {
    id: 'title',
    cell: info => {
    const value = info.getValue() as string;
    const words = value.split(" ");
    const display =
      words.length > 10
        ? words.slice(0, 10).join(" ") + "..."
        : value;
    return <i className="pr-5 pl-1">{display}</i>;
    },
    header: () => <span>Title</span>,
    footer: info => info.column.id,
  }),
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
        <div className="inline-flex gap-x-2 px-5 py-2">
          <button
            type="button"
            className="rounded-md border border-transparent py-2 px-5 text-center text-sm bg-[#1877F2] hover:bg-sky-700 flex items-center justify-center"
            disabled={loading}
            onClick={() => uploadRow(cell.row.original.Id)}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <LiaFacebookSquare />}
          </button>
          
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
]
const Datatable = ({ posts }: News) => {
    const table = useReactTable({
        data: posts,
        columns,
        defaultColumn: {
          minSize: 60,
          maxSize: 800,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
          sorting: [{ id: 'Category', desc: false }],
        },
      });

    return (
      <>
      <div className="p-2">
      <Table className="">
            <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                    <TableHead className="border border-gray-300" key={header.id}>
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
                    <TableCell className="border border-gray-300" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell>
                      Count: {posts.length}
                    </TableCell>
                </TableRow>
            </TableFooter>
            </Table>
      </div>
      </>
    );

}

export default Datatable;