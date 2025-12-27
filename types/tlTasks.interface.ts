export interface createTaskList {
    tasks: creatTaskInterface[]
}

export interface creatTaskInterface {
    task_id: string;
    description: string;
    content: string;
    isNewPage: boolean;
    pagePath: string;
}