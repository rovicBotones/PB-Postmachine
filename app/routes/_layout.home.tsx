

import { getAllData } from "utils/posts.service";
import React, { useEffect } from "react";
import Datatable from "~/components/Datetable";
import Filter from "~/components/Filter";
import { redirect } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/_layout.home";
import { isAuthenticated } from "utils/auth.service";
import { toast } from "sonner";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "PB Post Machine" },
  ];
}
export type News = {
  Id: string
  Date: Date
  Category: string
  Title: string
  Author: string
}

export async function clientLoader({
  params,
}: Route.ClientLoaderArgs) {
  
  try {
    const isLoggedIn = await isAuthenticated();
    if (!isLoggedIn) {
      toast('My first toast');
      return redirect("/");
    }
    
    console.log("clientLoader called with params");
    const dateToday = new Date();
    const datas = await getAllData(dateToday);
    console.log(datas);
    return datas;
  } catch (error) {
    console.error(error);
    return [];
  }
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  console.log("clientAction triggered", request);
}

export default function Home({ loaderData } : Route.ComponentProps) {
  const posts = loaderData;
  
  return (
    <>
      <div className="mt-10">
          <Filter />
          <div className="p-2 grid mx-100 grid-cols-5 gap-4">
            <div></div>
            <div></div>
            <div></div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Button variant={"destructive"}>Print Tabloid</Button>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
            <Button variant={"default"}>Post All to Facebook</Button>
            </div>
          </div>
          
          <Datatable posts={posts}/>
      </div>
    </>
  );
}
