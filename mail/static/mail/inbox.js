document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  window.name = (window.name === "") ? "inbox" : window.name;

  return load_mailbox(window.name);
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  // option view includes archive and reply buttons
  options = document.querySelector('#options-view');

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3 id="mailboxType">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
  // ... do something else with emails ...
  fill_view(emails);

  switch (mailbox) {
    case "inbox":
          options.style.display = "block";
          break;
    case "sent":
          options.style.display = "none";
          break;
    case "archive":
          options.style.display = "block";
          break;
    default:options.style.display = "block";

  }
    window.name = mailbox;
  });
}

function view_mail(id){

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    document.querySelector('#email-from').innerHTML = email.sender;
    document.querySelector('#email-subject').innerHTML = email.subject;
    document.querySelector('#email-body').innerHTML = email.body;
    document.querySelector('#email-date').innerHTML = email.timestamp;
    archive_Btn = document.querySelector('#archive');
    archive_Btn.value = email.id;
    reply_Btn = document.querySelector('#reply');
    reply_Btn.value = email.id;
    if (email.archived){
      archive_Btn.innerHTML = "Unarchive";
    }
    else {
      archive_Btn.innerHTML = "Archive";
    }
    email_seen(email.id);
});

}


function send_email(){

  fetch('/emails', {
  method: 'POST',
  body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
  })
})
.then(response => response.json())
.then(result => {
    // Print result
    console.log(result);

});

  //to load users sent mailbox after submitting email form
  window.name = "sent";
}



function fill_view(emails){
  var x = document.querySelector('#emails-view');
  for (var i=0; i < emails.length; i++){
    x.append(create_mail_div(emails[i]));
  }
}

function create_mail_div(mail){

  const cover_div = document.createElement('div');
  cover_div.className = 'coverDiv row';
  cover_div.id = mail.id;
  if (mail.read) {
    cover_div.style.backgroundColor = "lightgray";
  }

  cover_div.addEventListener('click', function() {
    view_mail(cover_div.id);
    });

  const sender = document.createElement('h6');
  sender.className = "mailSender col-4";
  if(document.querySelector('#mailboxType').innerHTML === "Sent") {

    mail.recipients.forEach((user, i) => {
      sender.innerHTML += user+ "<br>";
    });
  }else {sender.innerHTML = mail.sender;}


  const date = document.createElement('h6');
  date.className = "mailDate col-4";
  date.innerHTML = mail.timestamp;

  const subject = document.createElement('h6');
  subject.className = "mailSubject col-4";
  subject.innerHTML = mail.subject;

  cover_div.appendChild(sender);
  cover_div.appendChild(subject);
  cover_div.appendChild(date);
  return cover_div;
}

function archive_email(){
  email_id = event.target.value;
  var archived = Boolean(event.target.innerHTML === "Archive");

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
    archived: archived
    })
  });

  if (archived) {
    event.target.innerHTML = "Unarchive";
  }
  else {
    event.target.innerHTML = "Archive";
  }

  window.name="inbox";
  location.reload();
}

function email_seen(id){
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
    read: true
    })
  });
}

function reply(){
  email_id = event.target.value;

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

    compose_email();
    document.querySelector('#compose-recipients').value = email.sender;
    email_subject = document.querySelector("#compose-subject");
    email_body = document.querySelector('#compose-body');
    if (email.subject.includes("Re: ")){
      email_subject.value = email.subject
      email_body.value = email.body
    }
    else {
      email_subject.value = "Re: " + email.subject;
      email_body.value = `On ${email.timestamp}, ${email.sender} wrote:\n ${email.body}`;
    }

  });

}
