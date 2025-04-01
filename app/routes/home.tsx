
import type { Route } from "./+types/home";
import { getAllData, uploadToFacebook } from "utils/posts.service";
import React from "react";
import Datatable from "~/Components/Datetable";
import Filter from "~/Components/Filter";
import { redirect } from "react-router";
import { Button } from "~/Components/ui/button";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Peoples Balita Poster" },
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
    const dateToday = new Date();
    const datas = await getAllData(dateToday);
    console.log(datas);
    return datas;
  } catch (error) {
    console.error(error);
    return [];
  }
}
export async function clientAction({request}: Route.ClientActionArgs) {
  console.log("clientAction triggered", request);
}

export default function Home({loaderData} : Route.ComponentProps) {
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
              <Button variant={"print"}>Print Tabloid</Button>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
            <Button variant={"fb"}>Post All to Facebook</Button>
            </div>
          </div>
          
          <Datatable posts={posts}/>
      </div>
    </>
  );
}
