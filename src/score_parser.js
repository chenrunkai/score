const STATIC_GPA={
    'P': null,
    'NP': null,
    'EX': null,
    'IP': null, // 跨学期课程
    'I': null, // 缓考
    'W': null,
    // 17级研究生手册
    'A+': 4,
    'A': 4,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1,
    'F': 0,
};
const DESCRIPTION={
    'P': '通过',
    'NP': '未通过',
    'EX': '免修',
    'IP': '跨学期',
    'I': '缓考',
    'W': '退课',
};

function normalize_score_from_isop(score) {
    if(score==='合格') return 'P';
    else if(score==='不合格') return 'NP';
    else if(!isNaN(score)) return parseFloat(score);
    else return score;
}
export function check_score(score) {
    if(!isNaN(score)) {
        score=parseFloat(score);
        return score<=100.001 && score>=-.001;
    } else {
        return STATIC_GPA[score]!==undefined;
    }
}

export function course_gpa_from_normalized_score(score) {
    if(!isNaN(score)) {
        if(score>=60)
            return 4.-3.*Math.pow(100.-score,2)/1600.;
        else
            return null;
    } else if(STATIC_GPA[score]!==undefined) {
        return STATIC_GPA[score];
    } else
        return null;
}

function parse_teacher(line) {
    //"0006183063-熊校良$信息学院$助理研究员,0006172171-宋今$信息学院$馆员,0006181061-卢亮$新闻学院$副教授,0006182105-李子奇$信息学院$助理研究员,1006184103-王一涵$团委$讲师"
    let parts=line.split(',');
    if(line==='' || parts.length===0) return '（无教师信息）';

    let teacher=parts[0];
    let res=/^\d+-([^$]+)\$([^$]+)\$([^$]+)$/.exec(teacher);

    if(res)
        return `${res[1]}（${res[2]}）${parts.length>1 ? '等'+parts.length+'人' : ''}`;
    else
        return `${teacher}${parts.length>1 ? ' 等'+parts.length+'人' : ''}`;
}

export function parse_score(json) {
    console.log(json);

    let yjs=json.xslb==='yjs';
    let courses=json.cjxx.map((row)=>{
        let score=normalize_score_from_isop(yjs ? row.cj : row.xqcj);
        let details=yjs ? `${row.kclb}` : `${row.kclbmc} - ${parse_teacher(row.skjsxm)}`;
        return {
            course_id: row.kch,
            year: row.xnd,
            semester: row.xq,
            sem_name: `${row.xnd}-${row.xq}`,
            name: row.kcmc,
            credit: parseFloat(row.xf),
            score: score,
            true_score: score,
            details: details,
        }
    });

    let semesters={};
    courses.forEach((course,idx)=>{
        let sem=course.sem_name;
        if(!semesters[sem])
            semesters[sem]={
                name: `${course.year}学年 第${course.semester}学期`,
                year: course.year,
                semester: course.semester,
                course_list: [],
            };
        semesters[sem].course_list.push(idx);
    });

    let semesters_li=Object.values(semesters).sort((c1,c2)=>(
        c1.year!==c2.year ? c2.year-c1.year : c2.semester-c1.semester
    ));

    return {
        courses: courses,
        isop_gpa: json.gpa.gpa,
        semesters: semesters_li,
    };
}

export function calc_avg_gpa(courses,li) {
    let tot_credit=0;
    let tot_gpa=0;
    li.forEach((idx)=>{
        let co=courses[idx];
        let gpa=course_gpa_from_normalized_score(co.score);
        if(gpa!==null) {
            tot_credit+=co.credit;
            tot_gpa+=co.credit*gpa;
        }
    });
    if(tot_credit)
        return tot_gpa/tot_credit;
    else
        return NaN;
}

export function sum_credit(courses,li) {
    let tot_credit=0;
    li.forEach((idx)=>{
        tot_credit+=courses[idx].credit;
    });
    return tot_credit;
}

const SQRT3=Math.sqrt(3);
export function guess_score_from_gpa(gpa) {
    if(gpa>=4) return 100;
    else if(gpa>=1) return (-40*SQRT3*Math.sqrt(4-gpa)+300)/3;
    else return 'F';
}

export function fix(num,dig) { // without trailing 0 and trailing point
    if(typeof num!=='number') return num;
    let s=num.toFixed(dig);
    return s.replace(/^(.*?)0+$/,'$1').replace(/\.$/,'');
}

export function describe(score) {
    return DESCRIPTION[score]||'-.--';
}

export function score_tampered(courses) {
    return courses.some((co)=>(
        (''+co.score)!==(''+co.true_score)
    ));
}