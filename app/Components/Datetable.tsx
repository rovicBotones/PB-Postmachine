import { clientAction, type News } from "~/routes/home";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table";
import { LiaFacebookSquare  } from "react-icons/lia";
import dayjs from "dayjs";
import { Link } from "react-router";

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
    cell: info => <i className="pr-5 pl-1">{info.getValue()}</i>,
    header: () => <span>Title</span>,
    footer: info => info.column.id,
  }),
  {
    accessorKey: "Action",
    header: () => <span>Action</span>,
    cell: (cell: any) => {
      
      return (
        <div className="inline-flex gap-x-2 px-5 py-2">
          {/* <button type="button" className="rounded-md border border-transparent py-2 px-5 text-center text-sm bg-[#1877F2] hover:bg-sky-700" onClick={
            () => {
              <Link to={`/roles/${role.id}`}></Link>
            }
          }><LiaFacebookSquare /></button> */}
          <form id={`delete-form-${cell.row.original.Id}`} method="post" action={`/`}>
                
                        <button
                          form={`delete-form-${cell.row.original.Id}`}
                          className="w-[70px]"
                          type="submit"
                          name="intent"
                          value="delete"
                        >
                          click
                        </button>
                      
              </form>
          {/* <Link to={`/?postId=${cell.row.original.Id}`}>
            <button type="button" className="rounded-md border border-transparent py-2 px-5 text-center text-sm bg-[#1877F2] hover:bg-sky-700">
              <LiaFacebookSquare />
            </button>
          </Link> */}
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
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
          sorting: [{ id: 'Category', desc: false }],
        },
      });

    return (
      <>
        <table className="table-auto border-collapse border border-spacing-2 border-gray-400">
            <thead>
                {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                    <th className="border border-gray-300" key={header.id}>
                        {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                            )}
                    </th>
                    ))}
                </tr>
                ))}
            </thead>
            <tbody className="">
                {table.getRowModel().rows.map(row => (
                <tr className="" key={row.id}>
                    {row.getVisibleCells().map(cell => (
                    <td className="border border-gray-300" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                    ))}
                </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td>
                      Count: {posts.length}
                    </td>
                </tr>
            </tfoot>
            </table>
      </>
    );

}

export default Datatable;