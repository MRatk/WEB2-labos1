(async function getInfo(){
    const header = new URLSearchParams(window.location.search);
    const ticketID = header.get('ticketID');

    if(ticketID){
        try{
            const response = await fetch(`/tickets/${ticketID}`);
            if(!response.ok){
                throw new Error('No ticket with this ID found');
            }
            const data = await response.json();
            //console.log(data);
            document.getElementById('vatin').innerText = `VATIN: ${data.vatin}`
            document.getElementById('firstname').innerText = `First Name: ${data.firstname}`
            document.getElementById('lastname').innerText = `Last Name: ${data.lastname}`
            const createdAt = new Date(data.created_at);
            document.getElementById('created_at').innerText = `Created at: ${createdAt}`
        }catch (error){
            alert("Error with fetching ticket! " + error);
        }
    }else{
        alert("Error with fetching ticket!");
    }
})();

(async function getUser(){
    const response = await fetch('/tickets/userProfile');
    if(response.ok){
        const data = await response.json();
        //console.log(data);
        document.getElementById('userName').innerText = `Welcome user: ${data.nickname}`;
    }else{
        alert("User not signed in!");
    }
})();

function home_redirect(){
    window.location.href = 'home.html';
}
