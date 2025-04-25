async function upload(){
    let jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1];
    let fileToUpload = document.getElementsByName('file')[0].files
    if(fileToUpload){
        let formData = new FormData()
        formData.append("file", fileToUpload)
        let response = await fetch('/login/upload',{
            method:'POST',
            headers:{
                'Authorization':`Bearer ${jwt}`,
            },
            body: formData
        })
        if(response.ok){
            alert("file succesfully uploaded!")
        }else{
            alert("Internal server error: file not uploaded")
        }
    }else{
        alert("No file to upload!")
    }
}

async function update(){
    let jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1];
    let fileToUpdate = document.getElementsByName('ufile')[0].files
    let fileToUpdateID = document.getElementsByName('id').value
    if(fileToUpdate){
        let id = fileToUpdateID
        let formData = new FormData()
        formData.append('file', fileToUpdate)
        let response = await fetch('/update/'+id,{
            method:'POST',
            headers:{
                'Authorization':`Bearer ${jwt}`
            },
            body:formData
        })
        if(response.ok){
            alert("file succesfully updated!")
        }else{
            alert("Internal server error: file not updated")
        }
    }else{
        alert("No file to update!")
    }
}