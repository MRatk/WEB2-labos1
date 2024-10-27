function gen_QR_redirect(){
    window.location.href = 'genQR.html';
}

document.getElementById('pageIdForm').addEventListener('submit', async function(event){
    event.preventDefault();
    const response = await fetch('api/users');
    if(response.ok){
        const data = await response.json();
        if(data.logged){
            const ticketID = document.getElementById('pageID').value;
            const ticketResponse = await fetch(`tickets/validTicket/${ticketID}`);
            if(ticketResponse.ok){
                const ticketStatus = await ticketResponse.json();
                if(ticketStatus.ticketFound){
                    window.location.href = `ticketInformation.html?ticketID=${ticketID}`;
                }else{
                    alert("Please enter valid ticket ID!");
                }
            }else{
                alert("Please enter valid ticket ID!")
            }
        }else {
            alert("User must be signed in to view information about ticket!");
        }
    }

});

document.getElementById('logoutButton').addEventListener('click', async function () {
    const response = await fetch('api/users');
    if (response.ok) {
        const data = await response.json();
        //console.log("ulogiran:" + data.logged);
        if (data.logged) {
            window.location.href = "/logout";
        } else {
            alert("User is not signed in!");
        }
    }
});



document.getElementById('loginButton').addEventListener('click', async function () {
    const response = await fetch('api/users');
    if(response.ok){
        const data = await response.json();
        //console.log("ulogiran:" + data.logged);
        if(data.logged){
            alert("User is already signed up!")

        }else{
            window.location.href = "/login";
        }
    }

});

(async function countTickets_checkUserStatus(){
    const response = await fetch('/count');
    if(response.ok){
        const data = await response.json();
        console.log(data.count);
        document.getElementById('count').innerText = `Number of generated tickets: ${data.count}` ;
    }

    const loginResponse = await fetch('api/users');
    if(loginResponse.ok){
        const loginStatus = await loginResponse.json();
        if(loginStatus.logged){
            document.getElementById('loginButton').style.display = 'none';
            document.getElementById('logoutButton').style.display = 'block';
        }else{
            document.getElementById('loginButton').style.display = 'block';
            document.getElementById('logoutButton').style.display = 'none';
        }
    }
})();