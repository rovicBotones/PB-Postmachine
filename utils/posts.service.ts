
import dayjs from "dayjs";
import { request, gql } from 'graphql-request';



export const getAllData = async (dateToday: Date) => {
    const dateTsss = dayjs(dateToday).format('YYYY-MM-DD');
    console.log(dayjs(dateTsss).get('month'), dateTsss);
    const date = dayjs(dateTsss).get('date');
    const month = dayjs(dateTsss).get('month') + 1;
    const year = dayjs(dateTsss).get('year');
    const data = await request(import.meta.env.VITE_API_URL, gql`
      query NewQuery {
          posts(first: 100, where: {dateQuery: {year: ${year}, month: ${month}, day: ${date} }}) {
            edges {
              node {
                id
                title
                categories {
                  nodes {
                    name
                  }
                }
                date
              }
            }
          }
        }
    `);
    const datas = [];
      for(let i = 0; i < data.posts.edges.length; i++) {
        const id = data.posts.edges[i].node.id;
        const date = new Date(data.posts.edges[i].node.date).toLocaleDateString('en-US');
        const category = data.posts.edges[i].node.categories.nodes[0].name;
        const title = data.posts.edges[i].node.title;
        const author = "Peoples Balita";
        datas.push({
          Id: id,
          Date: date,
          Category: category,
          Title: title,
          Author: author
        });
      }
    return datas;
  }
  interface IUploadToFacebook {
    id: string;
    status: string;
  }
  export const uploadToFacebookById = async (id: string) => {
    console.log("it hits");
    const {linkOfPost, titleOfPost} = await getDataById(id);
    let link = linkOfPost;
    let message = titleOfPost;
    console.log(link, message);
    const privacy = JSON.stringify({ value: "EVERYONE" });
    const encodedPrivacy = encodeURIComponent(privacy);
    let token = import.meta.env.VITE_ACCESS_TOKEN;
    let url = `https://graph.facebook.com/v22.0/123281457540260/feed?access_token=${token}&message=${message}&link=${link}&published=true&privacy=${encodedPrivacy}`;
    console.log(url);
    
    fetch(url, {
      method: 'post'
     });
    // console.log("uploadToFacebook", id);
    // return { id, status: "success" };
  };
  const getDataById = async (id: string) => {
    console.log("where: ", id);
    const data = await request(import.meta.env.VITE_API_URL, gql`
    query NewQuery {
      post(id: "${id}") {
        id
        link
        title
      }
    }
  `);
  // console.log("dats: ", data);
  // return "it hits";
    return {
      linkOfPost: data.post.link,
      titleOfPost: data.post.title
    };
  }