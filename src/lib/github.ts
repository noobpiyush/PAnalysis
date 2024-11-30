import { db } from '@/server/db';
import {Octokit} from 'octokit'
import axios from "axios"
import { aiSummariseCommit } from './gemini';
export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});


const githubUrl = 'https://github.com/docker/genai-stack'

type Response = {
    commitMessage: string
    commitHash: string
    commitAuthorName: string
    commitAuthorAvatar: string
    commitDate: string
}

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
    const [owner, repo] = githubUrl.split('/').slice(-2);

    if (!owner || !repo) {
        throw new Error("Invalid github url")
    }

    const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo
    })
    
    const sortedCommmits = data.sort((a:any, b:any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any[]

    return sortedCommmits.slice(0,10).map((commit:any) => ({
        commitHash:commit.sha as string,
        commitMessage:commit.commit.message ?? "",
        commitAuthorName: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit.author?.avatar_url ?? "",
        commitDate: commit.commit?.author?.date ?? ""
    }))
    
}   


export const pollCommits = async (projectId : string) => {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl);
    const unProcessedCommits = await filterUnprocessedCommits(projectId, commitHashes);

    const summaryResponse = await Promise.allSettled(unProcessedCommits.map(commit => {
        return summariseCommit(githubUrl,commit.commitHash)
    }))

    const summaries = summaryResponse.map((response) => {
        if (response.status === 'fulfilled') {
            return response.value as string
        }

        return "something went wrong"
    })

    const commits = await db.commit.createMany({
        data:summaries.map((summary,index) => {
            console.log(`processing ${index}`);
            
            return {
                projectId,
                commitHash:unProcessedCommits[index]!.commitHash,
                commitMessage:unProcessedCommits[index]!.commitMessage,
                commitAuthorName:unProcessedCommits[index]!.commitAuthorName,
                commitAuthorAvatar:unProcessedCommits[index]!.commitAuthorAvatar,
                commitDate:unProcessedCommits[index]!.commitDate,
                summary
            }
        })
    })


    return commits;
}

async function summariseCommit(githhubUrl:string, commitHash:string){
    //get diff then pass the diff into ai

    const {data} = await axios.get(`${githhubUrl}/commit/${commitHash}.diff`,{
        headers: {
            Accept:'application/vnd.github.v3.diff'
        }
    })

    return await aiSummariseCommit(data) || "something went wrong"
}

async function fetchProjectGithubUrl(projectId:string) {
    const project = await db.project.findUnique({
        where: {id:projectId},
        select: {
            githubUrl:true
        }
    })

    if(!project?.githubUrl){
        throw new Error("Project has no github URL")
    }

    return { project, githubUrl: project.githubUrl }
}

async function filterUnprocessedCommits(projectId:string, commitHashes:Response[]) {
    const processedCommits = await db.commit.findMany({
        where: {
            projectId
        }
    })
    const unProcessedCommits = commitHashes.filter((commit) => !processedCommits.some((processedCommit) => processedCommit.commitHash === commit.commitHash));
    return unProcessedCommits;
}

await pollCommits('cm448cpek0000xvevw60yzb0r').then(console.log
);