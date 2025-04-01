
import type { Route } from "./+types/home";
import { getAllData } from "utils/posts.service";
import React from "react";
import Datatable from "~/Components/Datetable";
import { redirect } from "react-router";
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
      <div>
          {/* <h1>Posts</h1> */}
          {/* Filter */}
          <br />
          <br />
          <div className="p-2 grid place-items-center">
            <Datatable posts={posts}/>
          </div>
      </div>
    </>
  );
}
