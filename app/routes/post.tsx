import { redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/post";

export async function action({request, params}: Route.ClientActionArgs){
    console.log("clientAction triggered", params.id);
    redirect("/");
}
// export async function clientLoader({params}: Route.ClientLoaderArgs){
//     // console.log("clientLoader triggered");
//     // console.log('params: ', params.id);
//     return {
//         id: params.id,
//     };
// }
// export default function Post({loaderData} : Route.ComponentProps) {
//     const post = useLoaderData<typeof loaderData>();
    
//     return (
//         <div>
//             <h1>Post</h1>
//             <p>{post.id}</p>
//         </div>
//     );
// }
