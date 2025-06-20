import axios from "axios";
import {callError, callSuccess} from "@/call";

export interface obj{
    id : number;
    title : string;
    author : string;
    abstract : string;
    postTime : string;
    type: string;
    total : number;
}

export async function getHomePage(pageNum: number, type: number) : Promise<obj[]> {
    try {

        const typeArray = ['article', 'patent', 'project', 'award'];

        if (type === 0){
            const response = await axios.post('/work/pageArticleEsHome', {
                pageSize: 10,
                pageNum: pageNum,
            });

            // console.log(response)

            if (response.status === 200) {
                if (response.data.code == 0) {

                    let result : obj[] = [];
                    // 论文
                    for (let i = 0; i < response.data.data.list.length; i++) {

                        let author : string = '';
                        if (response.data.data.list[i].authorNameList != null) {
                            for (let j = 0; j < response.data.data.list[i].authorNameList.length; j++) {
                                author += response.data.data.list[i].authorNameList[j] + ' ';
                            }
                        }

                        result.push({
                            id: response.data.data.list[i].id,
                            title: response.data.data.list[i].title,
                            author: "Author: " + author,
                            abstract: response.data.data.list[i].abstractText,
                            postTime: "Time: " + response.data.data.list[i].publicationDate,
                            type: '学术论文',
                            total: response.data.data.total
                        });
                    }

                    return result

                }else callError(response.data.message);
            } else callError('网络错误');

        }else if (type === 1){

            const response = await axios.post('/work/pagePatentEs', {
                pageSize: 10,
                pageNum: pageNum,
            });

            // console.log(response)

            if (response.status === 200) {
                if (response.data.code == 0) {

                    let result : obj[] = [];
                    // 专利
                    for (let i = 0; i < response.data.data.list.length; i++) {

                        let author : string = '';
                        if (response.data.data.list[i].category != null) {
                            for (let j = 0; j < response.data.data.list[i].category.length; j++) {
                                author += response.data.data.list[i].category[j] + ' ';
                            }
                        }

                        result.push({
                            id: response.data.data.list[i].id,
                            title: response.data.data.list[i].name,
                            author: "Category: " + author,
                            abstract: response.data.data.list[i].abstractText,
                            postTime: "Application Number: " + response.data.data.list[i].applicationId,
                            type: '专利',
                            total: response.data.data.total
                        });
                    }

                    return result

                }else callError(response.data.message);
            } else callError('网络错误');

        }else if (type === 2){

            const response = await axios.post('/work/pageProjectEs', {
                pageSize: 10,
                pageNum: pageNum,
            });

            console.log('project: ')
            console.log(response)

            if (response.status === 200) {
                if (response.data.code == 0) {

                    let result : obj[] = [];
                    // 项目
                    for (let i = 0; i < response.data.data.list.length; i++) {

                        let author : string = '';
                        if (response.data.data.list[i].authorNameList != null) {
                            for (let j = 0; j < response.data.data.list[i].authorNameList.length; j++) {
                                author += response.data.data.list[i].authorNameList[j] + ' ';
                            }
                        }

                        result.push({
                            id: response.data.data.list[i].id,
                            title: response.data.data.list[i].name,
                            author: author,
                            abstract: response.data.data.list[i].institutionName
                                + "科研项目",
                            postTime: "Ratification Number: "
                                + response.data.data.list[i].ratificationNumber,
                            type: '科研项目',
                            total: response.data.data.total
                        });
                    }

                    return result

                }else callError(response.data.message);
            } else callError('网络错误');

        }else if (type === 3){

            const response = await axios.post('/work/pageAwardEs', {
                pageSize: 10,
                pageNum: pageNum,
            });

            // console.log(response)

            if (response.status === 200) {
                if (response.data.code == 0) {

                    const words = [
                        '富有意义的',
                        '十分有价值的',
                        '美好的',
                        '超越常人的'
                    ]
                    let result : obj[] = [];
                    // 奖项
                    for (let i = 0; i < response.data.data.list.length; i++) {

                        let author : string = '';
                        if (response.data.data.list[i].authorNameList != null) {
                            for (let j = 0; j < response.data.data.list[i].authorNameList.length; j++) {
                                author += response.data.data.list[i].authorNameList[j] + ' ';
                            }
                        }

                        result.push({
                            id: response.data.data.list[i].id,
                            title: response.data.data.list[i].name,
                            author: "Author: " + author,
                            abstract: words[Math.floor(Math.random() * words.length)] + response.data.data.list[i].name,
                            postTime: "Id Code: " + response.data.data.list[i].id,
                            type: '奖项',
                            total: response.data.data.total
                        });
                    }

                    return result

                }else callError(response.data.message);
            } else callError('网络错误');

        }

    } catch (error) {
        //console.log('there are some errors in sendmail');
    }
    return []
}

export async function getTotalAuthor() : Promise<number> {
    try {
        const response = await axios.get('/author/get-total');
        if (response.status === 200) {
            if (response.data.code == 0) {

                // console.log('门户总数')
                // console.log(response)

                return response.data.data;

            }else callError(response.data.message);
        } else callError('网络错误');
    }catch (error) {}
    return 0;
}

export async function getTotalPaper() : Promise<number> {
    try {
        const response = await axios.get('/work/get-total');
        if (response.status === 200) {
            if (response.data.code == 0) {

                // console.log('学术成果总数')
                // console.log(response)

                return response.data.data;

            }else callError(response.data.message);
        } else callError('网络错误');
    }catch (error) {}
    return 0;
}

export async function getRecommend() : Promise<any> {
    try{
        const response = await axios.get('/work/recommendToGuest');
        if (response.status === 200) {
            if (response.data.code == 0) {

                // console.log('游客推荐')
                // console.log(response)

                return response.data.data;

            }else callError(response.data.message);
        } else callError('网络错误');
    }catch (e){}
}
