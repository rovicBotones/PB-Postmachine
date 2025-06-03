import type { Route } from "./+types/_layout.add-article";
import { isAuthenticated } from "utils/auth.service";
import { toast } from "sonner";
import { redirect } from "react-router";
export async function clientLoader({
  params, request
}: Route.ClientLoaderArgs) {
    const isLoggedIn = await isAuthenticated();
    if (!isLoggedIn) {
      toast('My first toast');
      return redirect("/");
    }
}
  
export default function addArticle(){
    return (
        <> 
        
        this is the add article page
        </>
    );
} 