Automatic notifications in the UI

The notifications system that shows messages regarding new comments, new videos, new 
shared albums and the addition of new videos to an album that a user is part of are all
handled by the messageq (lib/messageq.js) which then parses the messages from the server
and hashes them into different arrays based on their type.

From there, each message type array is iterated over and passed to a notify function that 
handles the notification differently depending on its type. All of the notification functions
are located in the 'lib/notify.js' file. Each of the notification functions will end up calling 
viblio.notify() with the necessary info needed to actually display the notification using
alertify.js.

Before passing the info on the viblio.notify() function the correct ich (icanhaz.js) 
template is created, and that html is essentially what is passed to the viblio.notify()
function.

In order to ensure that the images are loaded before the template is shown (to avoid 
missing or broken images) the image being used in the template is created using the 
new Image() method and then the image's onload event is used to then trigger the notification
to be shown. 
