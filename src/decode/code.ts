import {number} from "echarts";

export function decode_function(id : string) : string {

    const arr0 = id.split('-');
    let arr : number[] = [];

    for (let i = 0; i < arr0.length; i++){
        let x = 0;
        for (let j=0;j<arr0[i].length;j++) {
            let y = Number(arr0[i][j].charCodeAt(0) - 65);
            x = 10*x + y;
        }
        arr.push(x);
    }

    let result = '';
    let key = 0;

    for (let i = 0; i < 7; i++) {
        let num = 0;
        if (i === 0)      num = (2*arr[0]-arr[1])/4;
        else if (i === 1) num =             arr[1]/2;
        else if (i === 2) num =                   arr[2];
        else if (i === 3) num =                         (7*arr[3]-arr[4])/49;
        else if (i === 4) num =                                   arr[4]/7;
        else if (i === 5) num =                                           (2*arr[5] - arr[6])/4;
        else if (i === 6) num =                                                       arr[6]/2;
        if (num === 0){
            if (key === 0) continue;
        }
        key = 1;
        result += num.toString();
    }

    return result;
}
