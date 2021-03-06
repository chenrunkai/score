import {PKUHELPER_ROOT} from './infrastructure/const';
import {get_json} from './infrastructure/functions';

export function get_score(user_token) {
    return new Promise((resolve,reject)=>{
        fetch(PKUHELPER_ROOT+'api_xmcp/isop/scores?user_token='+encodeURIComponent(user_token))
            .then(get_json)
            .then((json)=>{
                if(!json.success) {
                    if(json.errCode && ['E01','E02','E03'].indexOf(json.errCode)!==-1)
                        throw new Error('授权失败，请尝试去树洞注销再重新登录账号。'+JSON.stringify(json));
                    else
                        throw new Error(JSON.stringify(json));
                }
                resolve(json);
            })
            .catch(reject);
    })
}