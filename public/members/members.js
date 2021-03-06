/*****************************************************************************
 * 
 * File: 
 *   /js/main.js
 *
 * Original Author:
 *   Grant Broadwater
 *
 * Description:
 *   Main functionality for all webpages in the beta sig markup project.
 *
 *****************************************************************************/

/* Indicate page is loading */
var memberLoadingProcessKey = "MemberPage";
startLoadingProcess( memberLoadingProcessKey );

/*****************************************************************************
 * 
 * Function:
 *   documentReady
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Callback for when the document is fully loaded.
 * 
 *****************************************************************************/

var documentReady = function() {

}
$( document ).ready( documentReady );


/*****************************************************************************
 * 
 * Function:
 *   loadContent
 * 
 * Parameters:
 *   currentUser = {
 *     username - Current User's username
 *     adminStatus - Current User's admin status
 *     authValue - the auth object provided by firebase
 *   }
 * 
 * Description:
 *   Loads all the members.
 * 
 *****************************************************************************/

var loadContent = function( currentUser ) {

  populateMemberList( currentUser.authValue );
  $( "#add-member-button" ).click( addMemberButtonHandler );

}
queueAdminStatusDependentFunction( ( 1 << userAdminStates.ADMIN ), loadContent );


/*****************************************************************************
 * 
 * Function:
 *   bootNonAdmin
 * 
 * Parameters:
 *   currentUser = {
 *     username - Current User's username
 *     adminStatus - Current User's admin status
 *     authValue - the auth object provided by firebase
 *   }
 * 
 * Description:
 *   Alerts and redirects all users who are not administrators.
 * 
 *****************************************************************************/

var bootNonAdmin = function( currentUser ) {

  alert( "You must be a markup admin to manage registered members." );
  window.location.replace( "/" );

}
queueAdminStatusDependentFunction( ~( 1 << userAdminStates.ADMIN ), bootNonAdmin );


/*****************************************************************************
 * 
 * Function:
 *   addMemberButtonHandler
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Handles event when user clicks the "Add Member" button
 * 
 *****************************************************************************/

var addMemberButtonHandler = function() {
  var fName = prompt( "Please enter the new member's:\n\nFirst Name", "" );
  
  if( fName == null )
    return;

  var lName = prompt( "Please enter the new member's:\n\nLast Name", "" );
  
  if( lName == null )
    return;

  var username = prompt( "Please enter the new member's:\n\nSchool Username (without @mst.edu)", "" );
  
  if( username == null )
    return;

  var id = prompt( "Please enter the new member's:\n\nStudent ID", "" );
  
  if( id == null )
    return;

  var shouldAdd = confirm( "Are you sure you want to add the following user?\n\n" +
                           fName + " " + lName + "\n" +
                           "username: " + username + "\n" +
                           "student id: " + id );

  if( !shouldAdd )
    return;

  var newMemberData = {
    "name": {
      "first": fName,
      "last": lName
    },
    "school": {
      "id": id,
      "username": username
    }
  }

  var newMemberPath = "/members/" + username;
  var newMemberRef = ref.child( newMemberPath );
  newMemberRef.once( "value", function( newMemberSnap ) {

    if( !newMemberSnap.exists() ) {
   
      var memberUsernamePath = "/members/usernames/" + id;
      var memberUsernameRef = ref.child( memberUsernamePath );
      memberUsernameRef.once( "value", function( memberUsernameSnap ) {

        if( !memberUsernameSnap.exists() ) {
          var changes = {};

          changes[ '/members/' + username ] = newMemberData;
          changes[ '/members/usernames/' + id ] = username;

          ref.update( changes );

          location.reload();

        } else { /* /members/usernames/*id* already exists */

          alert( "Cannot add user because a user with that student id already exists" );

        }

      } );

    } else { /* /members/*username* already exists */

      alert( "Cannot add user because a user with that username already exists" );

    }

  } ); // newMemberRef.once

}


/*****************************************************************************
 * 
 * Function:
 *   changeAdminContext
 * 
 * Parameters:
 *   memberContext - Relevant data pertaining to the member who is having 
 *                   their admin status changed.
 * 
 * Description:
 *   Completes action after user has indicated to change a member's admin 
 *   status.
 * 
 *****************************************************************************/

var changeAdminStatus = function( memberContext ) {

  var userSelection 
    = confirm( "Are you sure you want to change " + memberContext.name + "'s admin status from " + 
               memberContext.isAdmin + " to " + $( "#" + memberContext.checkID ).prop('checked') + "?" );

    if( userSelection ) {
      
      changes = {}

      changes['/members/' + memberContext.username + '/markup/admin' ] = ( !memberContext.isAdmin ? true : null );
      changes['/markup/admin/' + memberContext.username ] = ( !memberContext.isAdmin ? true : null );

      firebase.database().ref().update( changes );
    } else {
      // TODO: Just cancel 
      location.reload();
    }

}


/*****************************************************************************
 * 
 * Function:
 *   clearMemberHandler
 * 
 * Parameters:
 *   memberContext - Relevant data pertaining to the member who is up for 
 *                   removal.
 * 
 * Description:
 *   Handles evnet when user clicks the clear button.
 * 
 *****************************************************************************/

var clearMemberHandler = function( memberContext ) {
  
  var shouldDelete = confirm( "Are you sure you want to remove " + memberContext.name + " as a member?" );

  if( !shouldDelete ) {
    return;
  }

  var changes = {};

  changes[ "/members/" + memberContext.username ] = null;
  changes[ "/members/usernames/" + memberContext.id ] = null;
  changes[ "/markup/admin/" + memberContext.username ] = null;

  ref.update( changes );

  location.reload();
} 


/*****************************************************************************
 * 
 * Function:
 *   populateMemberList
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Populate the member list assuming user is already authenticated and is
 *   verified as admin.
 * 
 *****************************************************************************/

var populateMemberList = function( currentUser ) {

  var membersPath = "/members";
  var membersRef = ref.child( membersPath );
  membersRef.once( "value",  function( membersSnap ) {

    membersSnap.forEach( function( memberSnap ) {

      if( memberSnap.key === "usernames" ) {
        return;
      }
      
      var memberContext = {
        username: memberSnap.val().school.username,
        id: memberSnap.val().school.id,
        name: memberSnap.val().name.first + " " + memberSnap.val().name.last,
        isAdmin: memberSnap.val().markup ? ( ( memberSnap.val().markup.admin ) ? true : false ) : false,
        checkID: memberSnap.val().school.username + "Check",
        labelID: memberSnap.val().school.username + "Label"
      }
      var clearID = memberSnap.val().school.username + "Clear";
      var checkVal = ( memberContext.isAdmin ) ? "Checked" : "";
      var isAdminStr = "Is Markup Admin";
      var isNotAdminStr = "Is Not Markup Admin";

      // TODO: Make mdl.io checkbox
      var memberDiv = $(
        '<div class="mdl-cell mdl-cell--6-col">' +
          '<div class="cell-container direct-content-cell">' +
            '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="' + memberContext.checkID +'" id="' + memberContext.labelID + '">' +
              '<input type="checkbox" id="' + memberContext.checkID + '" class="mdl-checkbox__input" ' + checkVal + '>' +
              '<span class="mdl-checkbox__label">' + memberContext.name + '</span>' +
              '<button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored" style="float: right;" id="' + clearID + '"><i class="material-icons">clear</i></button>' +
            '</label>' +
            '<div class="mdl-tooltip" data-mdl-for="' + memberContext.labelID + '">' +
              ( ( memberContext.isAdmin ) ? isAdminStr : isNotAdminStr ) +
            '</div>' +
          '</div>' +
        '</div>' 
      );

      memberDiv.change( function() {
        if( !changeAdminStatus( memberContext, $( this ) ) ) {
          return false;
        }
      } );

      memberDiv.insertBefore( $( "#membersPlacehoder" ) );

      if( emailToUsername( currentUser.email ) === memberContext.username ) {
        $( "#" + memberContext.checkID ).prop( "disabled", true );
        $( "#" + clearID ).prop( "disabled", true );
      }

      $( "#" + clearID ).click( function() {
        clearMemberHandler( memberContext );
      } );

    } );

  } ); 

  terminateLoadingProcess( memberLoadingProcessKey );

}