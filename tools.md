## AI Tools

### 1. Read File (read_file)
Description: Returns file content for a given a path from starting line to ending line. 
Inputs: (path,start,end)
path:Absolute path of the file; start: Starting line(Default 0); ending line(Default -1)
Output: (content)
Available to: Planner Agent, Codegen agent, Validation planning agent
Impl Details: Use existing filesystem tools in fs/workspace.ts create new tools there if needed. Use workspace from jobContext as the place to be the place from where you would be reading the file. Pls have a fallback as well - if file not found -> Return not found

### 2. Create File (create_file)
Description: Creates an empty file for a given path.
Inputs: (path)
path:Absolute path of the file
Output: (success:true/false)
Available to: Planner Agent, Validation planning agent
Impl Details: Use existing filesystem tools in fs/workspace.ts create new tools there if needed. Use workspace from jobContext as the place to be the place to where you would be creating the file. Pls have a fallback as well - if file failed to be created -> Return a error response

### 3. Delete File (delete_file)
Description: Deletes a file for a given path.
Inputs: (path)
path:Absolute path of the file
Output: (success:true/false)
Available to: Planner Agent, Validation planning agent
Impl Details: Use existing filesystem tools in fs/workspace.ts create new tools there if needed. Use workspace from jobContext as the place to be the place to where you would be deleting the file. Pls have a fallback as well - if file failed to be deleted -> Return a error response

### 4. Apply Patch (apply_patch)
Description: Applies patch to a file
Inputs: (patch_string)
patch_string: patch_string
Output: (success:true/false)
Available to: Codegen agent
Impl Details: Works exactly like codex apply_patch.
For example: the input would look something like this 
*** Begin Patch
*** Update File: prompts/planNodePrompt.ts
@@
-const x = 1;
+const x = 2;
*** End Patch
Use workspace from jobContext & Use existing filesystem tools in fs/workspace.ts create new tools there if needed. Handle failure by returning specific error messags


### 5. Search (search)
Description: rg search
Inputs: (search_query)
Outputs: ({path,content}[]) (List of path and content (Content is 1 line), max 20)
Available to: Planner Agent, Validation planning agent
Impl Details: Uses rg search. Use workspace from jobContext. Works exactly like codex search.

### 6. List directory (list_dir)
Description: Lists directory/Folder structure for a given path
Inputs: (path,depth) 
path:lute path of the file, depth: max 3
Available to: Planner Agent, Validation planning agent
Impl Details: list directory to a certain depth for folders from jobContext. If the folder doesn't exist - return a suitable error message
