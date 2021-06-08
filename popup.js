// Utility functions
const callAsanaApi = function(request, path, options, data, callback) {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function() {
    callback(JSON.parse(this.response));
  });
  // const manifest = chrome.runtime.getManifest();
  const manifest = {'name': 'AB'};
  const client_name = ['chrome-extension', manifest.version, manifest.name].join(':'); // Be polite to Asana API
  let requestData;
  if (request === 'POST' || request === 'PUT') {
    requestData = JSON.stringify({data: data});
    options.client_name = client_name;
  } else {
    options.opt_client_name = client_name;
  }
  let requestUrl = 'https://app.asana.com/api/1.1/' + path;
  if (Object.keys(options).length) {
    let parameters = '';
    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        parameters += [key, '=', options[key], '&'].join('');
      }
    }
    parameters = parameters.slice(0, -1);
    requestUrl += '?' + parameters;
  }
  xhr.open(request, encodeURI(requestUrl));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-Allow-Asana-Client', '1'); // Required to authenticate for POST & PUT
  xhr.send(requestData);
  return true; // Will respond asynchronously.
};


const displaySpinner = function(element) {
  const spinnerArray = ['◴', '◷', '◶', '◵'];
  let i = 0;
  const setIntervalFunction = setInterval(function() {
    element.innerHTML = spinnerArray[i];
    i = (i + 1) % spinnerArray.length;
  }, 300);

  return function(element, resultSymbol) {
    clearInterval(setIntervalFunction);
    element.innerHTML = resultSymbol;
    setTimeout(function() {
      element.innerHTML = '';
    }, 3000)
  }
}


const findTaskGid = function(url) {
  const taskGidRegexPatterns = [
    /https:\/\/app\.asana\.com\/0\/\d+\/(\d+)/,
    /https:\/\/app\.asana\.com\/0\/inbox\/\d+\/(\d+)\/\d+/,
    /https:\/\/app\.asana\.com\/0\/search\/\d+\/(\d+)/
  ];
  for (let i = 0; i < taskGidRegexPatterns.length; i++) {
    const match = taskGidRegexPatterns[i].exec(url);
    if (match) return match[1];
  }
};


// Event listeners
window.addEventListener('load', function() {
  const selectWorkspaces = document.querySelector('#selectWorkspaces');
  const spanTask = document.querySelector('#spanTask');
  const buttonAddCollaborators = document.querySelector('#buttonAddCollaborators');

  callAsanaApi('GET', 'workspaces', {}, {}, function(response){
    response.data.sort(function(a, b) {
      if (a.name.toLowerCase() < b.name.toLowerCase()) {return -1;}
      else if (a.name.toLowerCase() > b.name.toLowerCase()) {return 1;}
      else {return 0;}
    })

    response.data.forEach(function(workspace) {
      let optionWorkspace = document.createElement('option');
      optionWorkspace.id = 'workspace-' + workspace.gid;
      optionWorkspace.textContent = workspace.name;
      optionWorkspace.value = workspace.gid;
      selectWorkspaces.appendChild(optionWorkspace);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { ABMessage: 'getTaskGid' }, function(messageResponse) {
        if (!messageResponse) {
          spanTask.textContent = 'N/A';
        } else {
          callAsanaApi('GET', `tasks/${messageResponse.data}`, {'opt_fields': 'followers, name'}, {}, function(response) {
            spanTask.textContent = response.data.name;
            spanTask.value = response.data.gid;
            spanTask.followerGids = response.data.followers.map(follower => follower.gid);
            buttonAddCollaborators.disabled = false;
          });
        }
      });

      chrome.tabs.sendMessage(tabs[0].id, { ABMessage: 'getWorkspaceGid' }, function(messageResponse) {
        selectWorkspaces.value = messageResponse.data;
      });
    });
  })

  const textReferenceTask = document.querySelector('#textReferenceTask');
  const datalistReferenceTask = document.querySelector('#datalistReferenceTask');

  textReferenceTask.addEventListener('input', function() {
    const potentialTaskGid = findTaskGid(textReferenceTask.value);
    if (potentialTaskGid) {
      callAsanaApi('GET', `tasks/${potentialTaskGid}`, {}, {}, function(response) {
        textReferenceTask.value = response.data.name;
        datalistReferenceTask.innerHTML = '';
        let optionTask = document.createElement('option');
        optionTask.id = 'task-' + response.data.gid;
        optionTask.value = response.data.gid;
        optionTask.textContent = response.data.name;
        datalistReferenceTask.appendChild(optionTask);
      });

    } else {
      callAsanaApi('GET', `workspaces/${selectWorkspaces.value}/typeahead`, {type: 'task', query: textReferenceTask.value}, {}, function(response) {
        datalistReferenceTask.innerHTML = '';
        response.data.forEach(function(task) {
          let optionTask = document.createElement('option');
          optionTask.id = 'task-' + task.gid;
          optionTask.value = task.gid;
          optionTask.textContent = task.name;
          datalistReferenceTask.appendChild(optionTask);
        });
      });
    }
  })

  const copyTypeAssignee = document.querySelector('#copyTypeAssignee');
  const copyTypeCollaborators = document.querySelector('#copyTypeCollaborators');
  const checkboxIincludeParent = document.querySelector('#checkboxIncludeParent');
  const checkboxIincludeSubtasks = document.querySelector('#checkboxIncludeSubtasks');
  const checkboxIncludeSibling = document.querySelector('#checkboxIncludeSibling');
  const checkboxOverwrite = document.querySelector('#checkboxOverwrite');
  const resultAddCollaborators = document.querySelector('#resultAddCollaborators');
  buttonAddCollaborators.addEventListener('click', function(event) {
    const hideSpinnerFunction = displaySpinner(resultAddCollaborators);
    const textReferenceTask = document.querySelector('#textReferenceTask');

    try {
      callAsanaApi('GET', `tasks/${textReferenceTask.value}`, {'opt_fields': 'assignee, followers, parent, subtasks.assignee,　subtasks.followers'}, {}, function(response) {
        const referenceTask = response.data;

        if (referenceTask.parent) {
          callAsanaApi('GET', `tasks/${referenceTask.parent.gid}`, {'opt_fields': 'assignee, followers, subtasks.assignee, subtasks.followers'}, {}, function(response) {
            const parentReferenceTask = response.data;
            const collaboratorGidSet = new Set([
              ...(Array.from(!copyTypeCollaborators.checked && Boolean(referenceTask.assignee) && [referenceTask.assignee.gid])),
              ...(Array.from(!copyTypeAssignee.checked && Boolean(referenceTask.followers.length) && referenceTask.followers.map(follower => follower.gid))),
              ...(Array.from(!copyTypeCollaborators.checked && checkboxIincludeParent.checked && Boolean(parentReferenceTask.assignee) && [parentReferenceTask.assignee.gid])),
              ...(Array.from(!copyTypeAssignee.checked && checkboxIincludeParent.checked && Boolean(parentReferenceTask.followers.length) && parentReferenceTask.followers.map(follower => follower.gid))),
              ...(Array.from(!copyTypeCollaborators.checked && checkboxIincludeSubtasks.checked && Boolean(referenceTask.subtasks.length) && referenceTask.subtasks.map(subtask => subtask.assignee? subtask.assignee.gid: null))),
              ...(Array.from(!copyTypeAssignee.checked && checkboxIincludeSubtasks.checked && Boolean(referenceTask.subtasks.length) && referenceTask.subtasks.map(subtask => subtask.followers.map(follower => follower.gid)))).flat(),
              ...(Array.from(!copyTypeCollaborators.checked && checkboxIncludeSibling.checked && Boolean(parentReferenceTask.subtasks.length) && parentReferenceTask.subtasks.map(subtask => subtask.assignee? subtask.assignee.gid: null))),
              ...(Array.from(!copyTypeAssignee.checked && checkboxIncludeSibling.checked && Boolean(parentReferenceTask.subtasks.length) && parentReferenceTask.subtasks.map(subtask => subtask.followers.map(follower => follower.gid)))).flat()
            ]);
            collaboratorGidSet.delete(null);
            if (checkboxOverwrite.checked) callAsanaApi('POST', `tasks/${spanTask.value}/removeFollowers`, {}, { 'followers': spanTask.followerGids.filter(followerGid => !collaboratorGidSet.has(followerGid)) }, function(response) { return; });
            callAsanaApi('POST', `tasks/${spanTask.value}/addFollowers`, {}, { 'followers': Array.from(collaboratorGidSet) }, function(response) {
              hideSpinnerFunction(resultAddCollaborators, '✅');
            });
          });

        } else {
          const collaboratorGidSet = new Set([
            ...(Array.from(!copyTypeCollaborators.checked && Boolean(referenceTask.assignee) && [referenceTask.assignee.gid])),
            ...(Array.from(!copyTypeAssignee.checked && Boolean(referenceTask.followers.length) && referenceTask.followers.map(follower => follower.gid))),
            ...(Array.from(!copyTypeCollaborators.checked && checkboxIincludeSubtasks.checked && Boolean(referenceTask.subtasks.length) && referenceTask.subtasks.map(subtask => subtask.assignee? subtask.assignee.gid: null))),
            ...(Array.from(!copyTypeAssignee.checked && checkboxIincludeSubtasks.checked && Boolean(referenceTask.subtasks.length) && referenceTask.subtasks.map(subtask => subtask.followers.map(follower => follower.gid)))).flat()
          ]);
          collaboratorGidSet.delete(null);
          if (checkboxOverwrite.checked) callAsanaApi('POST', `tasks/${spanTask.value}/removeFollowers`, {}, { 'followers': spanTask.followerGids.filter(followerGid => !collaboratorGidSet.has(followerGid)) }, function(response) { return; });
          callAsanaApi('POST', `tasks/${spanTask.value}/addFollowers`, {}, { 'followers': Array.from(collaboratorGidSet) }, function(response) {
            hideSpinnerFunction(resultAddCollaborators, '✅');
          });
        }
      });

    } catch {
      hideSpinnerFunction(resultAddCollaborators, '⚠');
    }

  });

});