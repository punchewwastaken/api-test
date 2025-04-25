async function createCookie(id){
    document.cookie=`jwt=${id}; path=/`
    console.log(document.cookie)
}

async function login(){
    let username = document.getElementById("name").value
    let password = document.getElementById("password").value
    if(!username||!password){
        alert("Empty fields!")
    } else{
        let data = {
            username:username,
            password:password
        }
        let response = await fetch("/login/login",{
            method:'POST',
            headers:{
                'Content-type':'application/JSON'
            },
            body:JSON.stringify(data)
        })
        let token = await response.json()
        createCookie(token.jwt)
        window.location.replace("upload.html")
    }
}