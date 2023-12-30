document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  document.querySelector("#compose-form").addEventListener("submit", send_email);

  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view_mail').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'none'

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  console.log("compose loaded")
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view_mail').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'none'

  fetch(`emails/${mailbox}`)
  .then(res => res.json())
  .then(emails => {
    const emailsView = document.querySelector('#emails-view');
    emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.className = email.read ? 'email-box read' : 'email-box unread';
      emailDiv.innerHTML = `
        <strong>From:</strong> ${email.sender} <br>
        <strong>Subject:</strong> ${email.subject} <br>
        <strong>Timestamp:</strong> ${email.timestamp} <br>
        <a href="#" class="openmail btn btn-primary" data-email-id="${email.id}">View Email</a>
        <a href="#" class="reply btn btn-danger" data-email-id=${email.id}">Reply</a>
        <a href="#" class="archiveMail btn btn-primary" data-email-id="${email.id}">${email.archived ? 'Unarchive' : 'Archive'}</a>
      `;

      emailsView.appendChild(emailDiv);

      emailDiv.querySelector('.openmail').addEventListener('click', function(event) {
        event.preventDefault();
        view_mail(this.getAttribute('data-email-id'));
      });

      emailDiv.querySelector('.archiveMail').addEventListener('click', function(event) {
        event.preventDefault();
        archive_mail(this.getAttribute('data-email-id'), email.archived, mailbox);
      });

      emailDiv.querySelector('.reply').addEventListener('click', function(event) {
        event.preventDefault();
        reply_mail(this.getAttribute('data-email-id'), email);
      });
    });
  });
}



function archive_mail(email_id, currentlyArchived, currentMailbox) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !currentlyArchived // Toggle the archived status
    })
  })
  .then(() => {
    // After changing the archived status, refresh the mailbox view
    load_mailbox(currentMailbox); // Or another mailbox, depending on your logic
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function reply_mail(email_id,email) {
  // Hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view_mail').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'block';

  const mail = email;

  // Display the reply view
  const replyView = document.querySelector('#reply-view');
  replyView.style.display = 'block';
  replyView.innerHTML = `
    <h3>Reply Email</h3>
    <form id="reply-form">
        <div class="form-group">
            From: <input disabled class="form-control" value="${mail.recipients}">
        </div>
        <div class="form-group">
            To: <input id="reply-recipients" class="form-control" value="${mail.sender}">
        </div>
        <div class="form-group">
            <input class="form-control" id="reply-subject" value="Re: ${mail.subject}" placeholder="Subject">
        </div>
        <textarea class="form-control" id="compose-body" placeholder="Body">
          \n\n-----\nReplying to [${email.timestamp}]:\n${email.body}</textarea>
        <input type="submit" id="reply-send" class="btn btn-primary"/>
    </form>
  `;

  // Add event listener for form submission (adapt send_email or create a new function)
  document.querySelector('#reply-form').addEventListener('submit', send_reply);
}




function view_mail(email_id) {
  // Hide other views and display the view_mail section
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'none'
  const viewMailDiv = document.querySelector('#view_mail');
  viewMailDiv.style.display = 'block';
  viewMailDiv.innerHTML = '';  // Clear any previous content

  // fyi id is coming from button
  fetch(`emails/${email_id}`)
  .then(res => res.json())
  .then(mail => {
    // make the div
    const mailDiv = document.createElement('div');
    mailDiv.className = 'mailInfo';
    mailDiv.innerHTML = `
      <h3>From: ${mail.sender}</h3>
      <p>To: ${mail.recipients.join(", ")}</p>
      <p>Subject: ${mail.subject}</p>
      <p>Timestamp: ${mail.timestamp}</p>
      <hr>
      <p>${mail.body}</p>
      <br>
      <br>
      <br>
      <a href="#" class="reply btn btn-danger" data-email-id=${mail.id}">Reply</a>
    `;

    // Append the div to the view_mail section
    viewMailDiv.appendChild(mailDiv);
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
  })
  .catch(error => {
    console.error('Error:', error);
    viewMailDiv.innerHTML = `<p>Error loading email.</p>`;
  });
  

  console.log("view_mail loaded");
}



function send_reply(Event) {
  Event.preventDefault();

  const recipient = document.querySelector('#reply-recipients').value;
  const subject = document.querySelector('#reply-subject').value;
  const body = document.querySelector('#reply-body').value;

  console.log('Recipient:', recipient, 'Subject:', subject, 'Body:', body);

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body
    })
  })
  .then(res => res.json())
  .then(result => {
    console.log("reply sent: ", result)
    load_mailbox('sent')
  })
  .catch(error => {
    console.error("Error in reply:", error);
  })
}


function send_email(Event) {
  //stopping the form submit
  Event.preventDefault();

  const recipient = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body
    })
  })
  .then(res => {
    if (!res.ok) {
      // If we not gucci, throw error and stop
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    // If we are gucci then go for it
    return res.json();
  })
  .then(result => {
    console.log(result);
    if (!result.error) {
      // not error? go mailbox
      load_mailbox('sent');
    } else {
      // error? debugging time.
      console.error("Error sending email:", result.error);
    }
  })
  .catch(error => {
    // catch network errors
    console.error("Error:", error);
  });
  // debug - will remove
  console.log('Recipient:', recipient, 'Subject:', subject, 'Body:', body);
}