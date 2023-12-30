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
  
  fetch(`emails/${mailbox}`)
  .then(res => res.json())
  .then(emails => {
    console.log(emails)
    const emailsView = document.querySelector('#emails-view')
    emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    const list = document.createElement('ul');
    emailsView.appendChild(list);

      emails.forEach(email => {
        // Create a div for each email
        const emailDiv = document.createElement('div');
        emailDiv.className = email.read ? 'email-box read' : 'email-box unread';
        emailDiv.innerHTML = `
          <strong>From:</strong> ${email.sender} <br>
          <strong>Subject:</strong> ${email.subject} <br>
          <strong>Timestamp:</strong> ${email.timestamp} <br>
          <a href="#" class="openmail" data-email-id="${email.id}">View Email</a>
        `;
  
        // Append the div to the emails view
        emailsView.appendChild(emailDiv);

        emailDiv.querySelector('.openmail').addEventListener('click', function(event) {
          event.preventDefault();
          view_mail(this.getAttribute('data-email-id'));
      })
    })

  
  }) 
}

function view_mail(email_id) {
  // Hide other views and display the view_mail section
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
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
    `;

    // Append the div to the view_mail section
    viewMailDiv.appendChild(mailDiv);
  })
  .catch(error => {
    console.error('Error:', error);
    viewMailDiv.innerHTML = `<p>Error loading email.</p>`;
  });

  console.log("view_mail loaded");
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