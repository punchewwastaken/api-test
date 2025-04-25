let resourceList = document.getElementById("file-container")
async function upload(){
    let jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1]
    let fileToUpload = document.getElementsByName('file')[0].files[0]
    if(fileToUpload){
        let formData = new FormData()
        formData.append("file", fileToUpload)
        let response = await fetch('/create',{
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
    let jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1]
    let fileToUpdate = document.getElementsByName('ufile')[0].files[0]
    let fileToUpdateID = document.getElementById('id').value
    console.log(fileToUpdateID + " " + fileToUpdate)
    if(fileToUpdate){
        let id = fileToUpdateID
        let formData = new FormData()
        formData.append('ufile', fileToUpdate)
        let response = await fetch('/update/'+id,{
            method:'PUT',
            headers:{
                'Authorization':`Bearer ${jwt}`
            },
            body:formData
        })
        console.log(response)
        if(response.ok){
            alert("file succesfully updated!")
        }else{
            alert("Internal server error: file not updated")
        }
    }else{
        alert("No file to update!")
    }
}

function logout(){
    document.cookie = "jwt=; max-age=0; path=/"
    window.location.replace("index.html")
}

async function list(){
    let response = await fetch('/resources',{
        method:'GET',
        headers:{
            'Content-type':'application/json'
        },
    })
    let list = await response.json()
    console.log(list)
    list.forEach(element => {
        let div = document.createElement("div")
        div.innerHTML = `<p>${element.filename} </p><p>owner ${element.user}</p><button onclick=download(${element.id})>Download file</button>`
        resourceList.appendChild(div)
    })
}

async function download(input){
    let jwt = document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1];
    try{
        let response = await fetch('/resources/'+input,{
            method:"GET",
            headers:{
                'Authorization':`Bearer ${jwt}`
            },
        })
        if (!response.ok) {
            throw new Error(`File download failed: ${response.statusText}`);
        }
        console.log(response)
        let blob = await response.blob() //Convert response to binary data
        let url = URL.createObjectURL(blob)

        let a = document.createElement("a")
        a.href = url
        a.download = "download" // Sets filename for download
        document.body.appendChild(a)
        a.click() // Triggers file download
        document.body.removeChild(a)
        URL.revokeObjectURL(url) // Cleanup after download
    } catch (error) {
        console.error("Download error:", error)
    }
}

