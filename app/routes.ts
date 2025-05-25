import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes() satisfies RouteConfig;
// export default [
//     index("routes/login.tsx"),
//     route("dashboard", "routes/home.tsx"),
//     route("post/:id", "routes/post.tsx")
// ] satisfies RouteConfig;
