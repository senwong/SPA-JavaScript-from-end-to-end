/*
 * spa.shell.js
 * Shell module for SPA
*/
/* jslint            browser : true,   continue : true,
   devel  : ture,     indent : 2,        maxerr : 50,
   newcap : true,      nomen : true,   plusplus : true,
   regexp : true,     sloppy : true,       vars : false,
   white  : true
*/
/*global $,spa */

spa.shell = (function () {
  //-----------------BEGIN MODULE SCOPE VARIABLES-------------
  var
    configMap = {
      anchor_schema_map : {
        chat : { open : true, closed : true}
      },
      main_html : 
        `<div class="spa-shell-head">
            <div class="spa-shell-head-log"></div>
            <div class="spa-shell-head-acct"></div>
            <div class="spa-shell-head-search"></div>
        </div>
        <div class="spa-shell-main">
            <div class="spa-shell-main-nav"></div>
            <div class="spa-shell-main-content"></div>
        </div>
        <div class="spa-shell-foot"></div>
        <div class="spa-shell-chat"></div>
        <div class="spa-shell-modal"></div>`,

        chat_extend_time      : 1000,
        chat_retract_time     : 300,
        chat_extend_height    : 450,
        chat_retract_height   : 15,
        chat_extended_title     : 'click to retract',
        chat_retracted_title     : 'click to extend',
    },
    stateMap = { 
      $container        : null,
      is_chat_retracted : true,
      anchor_map        : {}
    },
    jqueryMap = {},

    setJqueryMap, toggleChat, onClickChat, initModule, copyAnchorMap, changeAnchorPart, onHashchange;
    //-------------EDN MODULE SCOPE VARIABLES-------------------
    //-------------BEGIN UTILITY METHODS------------------------
    copyAnchorMap = function () {
      return $.extend( true, {}, stateMap.anchor_map );
    }

    //-------------END UTILITY METHODS--------------------------
    //-------------BEGIN DOM METHODS----------------------------
    // Begin DOM method /changeAnchorPart/
    changeAnchorPart = function ( arg_map ) {
      var 
        anchor_map_revise = copyAnchorMap(),
        bool_return = true,
        key_name, key_name_dep;

      // Begin merge changes into anchro map
      KEYVAL:
      for ( key_name in arg_map ) {
        if ( arg_map.hasOwnProperty( key_name ) ) {

          // skip dependent keys during iteration
          if ( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }

          // update independent key value
          anchor_map_revise[key_name] = arg_map[key_name];

          //updating watching dependent key
          key_name_dep = '_' + key_name;
          if ( arg_map[key_name_dep] ) {
            anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
          }
          else {
            delete anchor_map_revise[key_name_dep];
            delete anchor_map_revise['_s' + key_name_dep];
          }
        }
      }
      //End merge change into anchor map

      //Begin attempt to upate URI; revert if not successful
      try {
        $.uriAnchor.setAnchor( anchor_map_revise );
      }
      catch ( error ) {
        $.uriAnchor.setAnchor( stateMap.anchor_map,null,true );
        bool_return = false;
      }
      return bool_return;
    };
    // Begin DOM method /setJqueryMap/
    setJqueryMap = function () { 
      var $container = stateMap.$container;
      jqueryMap = { 
        $container : $container,
        $chat      : $container.find('.spa-shell-chat')
      };
    };
    // End DOM method / setJqueryMap/
    // Begin DOM method /toggleChat/
    toggleChat = function ( do_extend, callback ) {
      var
        px_chat_ht = jqueryMap.$chat.height(),
        is_open    = px_chat_ht === configMap.chat_extend_height,
        is_closed  = px_chat_ht === configMap.chat_retract_height,
        is_sliding = ! is_open && ! is_closed;
      // avoid race condition
      if ( is_sliding ) { return false; }

      // Begin extend chat slider
      if ( do_extend ) {
        jqueryMap.$chat.animate(
          {height : configMap.chat_extend_height },
          configMap.chat_extend_time,
          function () {
            jqueryMap.$chat.attr(
              'title', configMap.chat_extended_title
            );
            stateMap.is_chat_retracted = false;
            if ( callback ){ callback(jqueryMap.$chat ); }
          }
        );
        return true;
      }
      // End extend chat slider
      // Begin retract chat slider 
      jqueryMap.$chat.animate(
        { height : configMap.chat_retract_height },
        configMap.chat_retract_time,
        function () {
          jqueryMap.$chat.attr(
            'title', configMap.chat_retracted_title
          );
          stateMap.is_chat_retracted = true;
          if ( callback ){ callback( jqueryMap.$chat );}
        }
      );
      return true;
      // End retract chat slider
    };
    // End DOM method /toggleChat/
    // -------------End DOM method------------------------------

    //-------------BEGIN EVENT HANDLES--------------------------
    onClickChat = function ( event ) {
      changeAnchorPart({
        chat: ( stateMap.is_chat_retracted ? 'open' : 'closed' )
      });
      return false;
    }
    // Begin event handler /onHashchange/
    onHashchange = function ( event ) {
      var
        anchor_map_previous = copyAnchorMap(),
        anchor_map_proposed,
        _s_chat_previous, _s_chat_proposed,
        s_chat_proposed;

      // attempt to parse anchor
      try { anchor_map_proposed = $.uriAnchor.makeAnchorMap(); }
      catch ( error ) {
        $.uriAnchor.setAnchor( anchor_map_revise, null, true);
        return false;
      }
      stateMap.anchor_map = anchor_map_proposed;

      // convenience vars
      _s_chat_previous = anchor_map_previous._s_chat;
      _s_chat_proposed = anchor_map_proposed._s_chat;

      //Begin adjust chat component if changed
      if ( ! anchor_map_previous
        || _s_chat_previous !== _s_chat_proposed
      ) {
        s_chat_proposed = anchor_map_proposed.chat;
      switch ( s_chat_proposed ) {
        case 'open' :
          toggleChat( true );
        break;
        case 'closed' :
          toggleChat( false );
        break;
        default :
          toggleChat( false );
          delete anchor_map_proposed.chat;
          $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
        }
      }
      // End adjust chat compnoent if changed
      return false;
    };
    // End event handler /onHashchange/
    //--------------END EVENT HANDLES---------------------------

    //-------------BEGIN PUBLIC METHODS------------------------
    // Begin public method / initMoule
    initModule = function ($container) {
      stateMap.$container = $container;
      $container.html( configMap.main_html );
      setJqueryMap();

      stateMap.is_chat_retracted = true;
      jqueryMap.$chat
        .attr( 'title', configMap.chat_retracted_title)
        .click( onClickChat );

      $.uriAnchor.configModule({
        schema_map : configMap.anchor_schema_map
      });

      spa.chat.configModule( {} );
      spa.chat.initModule( jqueryMap.$chat );
      $(window)
        .bind( 'hashchange', onHashchange )
        .trigger( 'hashchange');
    };
    // End public method / initModule/

    return { initModule : initModule };
    //------------EDN PUBLIC METHODS---------------
    } () );