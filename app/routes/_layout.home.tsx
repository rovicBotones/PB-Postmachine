import { getAllData, postAll } from "utils/posts.service";
import React, { useEffect } from "react";
import Datatable from "~/components/Datetable";
import Filter from "~/components/Filter";
import { redirect } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/_layout.home";
import { isAuthenticated, session } from "utils/auth.service";
import { getUserRole } from "utils/users.service";
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
export function meta({}: Route.MetaArgs) {
  return [{ title: "PB Post Machine" }];
}
export type News = {
  Id: string;
  Date: Date;
  Category: string;
  Title: string;
  Author: string;
};

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  try {
    const isLoggedIn = await isAuthenticated();
    const sessDetails = await session();
    if (!isLoggedIn) {
      toast("My first toast");
      return redirect("/");
    }
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const dateToday = new Date();
    const dateFilter = date ? new Date(date) : dateToday;
    const role = await getUserRole(sessDetails.sessionDetails);
    const filter = {
      Date: dateFilter,
      Category: url.searchParams.get("category") || "",
      Title: url.searchParams.get("title") || "",
    };
    const datas = await getAllData(filter);
    console.log("isLoggedIn: ", role);
    datas.map((x) => {
      x.role = role;
    });
    console.log('data: ', datas);
    return {
      datas: datas,
      filter: filter,
      role: role,
    };
  } catch (error) {
    console.error(error);
    return [];
  }
}
export function HydrateFallback() {
  return <div>Loading...</div>;
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  console.log("clientAction triggered", request);
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const posts = loaderData;

  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const handlePostAll = async () => {
    setLoading(true);
    try {
      setOpen(false);
      await postAll(posts.filter);
      toast.success("All posts have been successfully posted to Facebook!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="m-2">
        <Filter />
        <div className="p-2 grid grid-cols-5 gap-4">
          <div></div>
          <div></div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Button variant="go">Print Tabloid</Button>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Button
              variant="outline"
              onClick={() => {
                // window.location.href = "/add-article";
              }}
            >
              Add Article
            </Button>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Credenza open={open} onOpenChange={setOpen}>
              <CredenzaTrigger asChild>
                <Button
                  variant={"default"}
                  disabled={posts.datas.length <= 0 || loading}
                >
                  {loading ? "Posting..." : "Post All to Facebook"}
                </Button>
              </CredenzaTrigger>
              <CredenzaContent>
                <CredenzaHeader>
                  <CredenzaTitle>Bulk Posting</CredenzaTitle>
                  {/* <CredenzaDescription>
                      A responsive modal component for shadcn/ui.
                    </CredenzaDescription> */}
                </CredenzaHeader>
                <CredenzaBody>
                  Are you sure you want to post all{" "}
                  <b className="text-blue-600">
                    {posts.datas.length > 0 ? posts.datas.length : ""}
                  </b>{" "}
                  {posts.datas.length > 1 ? "articles" : "article"} to facebook?
                </CredenzaBody>

                <CredenzaFooter>
                  {posts.role === "admin" ? (
                    <>
                      <Button
                        variant="go"
                        id="logout"
                        onClick={handlePostAll}
                        disabled={loading}
                      >
                        Yes
                      </Button>
                      <CredenzaClose asChild>
                        <Button>No</Button>
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
        <div className="min-h-0 overflow-auto">
          <Datatable posts={posts.datas} />
        </div>
      </div>
    </>
  );
}
