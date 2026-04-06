## Tools

### 1. Read File (read_file)
Description: Returns file content for a given a path.
Inputs: (path,start,end)
path:Absolute path of the file; start: Starting line(Default 0); ending line(Default -1)
Output: (content)
Available to: Planner Agent, Codegen agent, Validation planning agent

### 2. Create File (create_file)
Description: Creates an empty file for a given path.
Inputs: (path)
path:Absolute path of the file
Output: (success:true/false)
Available to: Planner Agent, Validation planning agent

### 3. Delete File (delete_file)
Description: Deletes a file for a given path.
Inputs: (path)
path:Absolute path of the file
Output: (success:true/false)
Available to: Planner Agent, Validation planning agent

### 4. Apply Patch (apply_patch)
Description: Applies patch to a file
Inputs: (patch_string)
patch_string: patch_string
Output: (success:true/false)
Available to: Codegen agent

### 5. Search (search)
Description: rg search
Inputs: (search_query)
Outputs: ({path,content}[]) (List of path and content (Content is 1 line), max 20)
Available to: Planner Agent, Validation planning agent

### 6. List directory (list_dir)
Description: Lists directory/Folder structure for a given path
Inputs: (path,depth) 
path:lute path of the file, depth: max 3
Available to: Planner Agent, Validation planning agent
