
import dayjs from "dayjs";
import { request, gql } from 'graphql-request';

type FilterDto = {
    Date: Date | undefined;
    Category: string;
    Title: string;
}


export const getAllData = async (filter: FilterDto) => {
    const dateTsss = dayjs(filter.Date).format('YYYY-MM-DD');
    console.log(dayjs(dateTsss).get('month'), dateTsss);
    const date = dayjs(dateTsss).get('date');
    const month = dayjs(dateTsss).get('month') + 1;
    const year = dayjs(dateTsss).get('year');
    const data = await request(import.meta.env.VITE_API_URL, gql`
      query NewQuery {
        posts(
          first: 100
          where: {dateQuery: {year: ${year}, month: ${month}, day: ${date}}, categoryName: ${filter.Category ? `"${filter.Category}"` : "null"}}
        ) {
          edges {
            node {
              id
              categories {
                nodes {
                  name
                }
              }
              title
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
  export const postAll = async (filter: FilterDto) => {
    const dateToday = new Date();
    const datas = await getAllData(filter);
    console.log(datas);
    const results: IUploadToFacebook[] = [];
    for (const data of datas) {
      try {
        await uploadToFacebookById(data.Id);
        results.push({ id: data.Id, status: 'success' });
      } catch (error) {
        console.error(`Failed to upload post with ID ${data.Id}:`, error);
        results.push({ id: data.Id, status: 'failed' });
      }
    }
    return results;
  }
  export const uploadToFacebookById = async (id: string): Promise<string>  => {
    const {linkOfPost, titleOfPost} = await getDataById(id);
    let link = linkOfPost;
    let message = titleOfPost;
    let token = import.meta.env.VITE_ACCESS_TOKEN;
    let url = `https://graph.facebook.com/v22.0/123281457540260/feed?access_token=${token}&message=${message}&link=${link}&published=true&scope=publish_to_groups`;
    console.log(url);
    
    fetch(url, {
      method: 'post'
     }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
     });
     return 'ok';
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