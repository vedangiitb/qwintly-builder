import { creatTaskInterface } from "../../types/tlTasks.interface.js";

export const createTaskImpl = async (
  task_id: string,
  description: string,
  content: string,
  isNewPage: boolean,
  pagePath: string
): Promise<creatTaskInterface> => {
  const task: creatTaskInterface = {
    task_id,
    description,
    content,
    isNewPage,
    pagePath,
  };

  // Optional: persist, enqueue, or store later
  console.log("Created task:", task);

  return task;
};
