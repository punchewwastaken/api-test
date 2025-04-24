async function createAccount(){
    let username = document.getElementById("usr").value;
    let password = document.getElementById("pass").value;
    if(!username||!password){
        alert("Empty fields!")
    } else{
        let info = {
            username:username,
            password:password
        }
        let response = await fetch('/login/signup',{
            method:'POST',
            headers:{
                'Content-type':'application/JSON'
            },
            body:JSON.stringify(info)
        })
        if(response.ok){
            window.location.replace("login.html")
        }else{
            alert("Server error!")
        }
    }
}