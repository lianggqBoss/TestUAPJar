/**for /main/index.do
 * @author dream.chen
 * binding to top nav id and left nav id is topNavBar and leftNav
 * binding tabs container id is tabPages
 */

;(function($obj,$){
  //禁用返回按钮
  document.onkeydown = function(event) {
    if (! event) {
      event = window.event;
    }
    if (event.keyCode == 8) {
      //return false;
    }
    if (event.altKey && (event.keyCode == 37 || event.keyCode == 39)) {
      return false;
    }
  };
  function toTreeData(data,fieldMapping,onIterateItem){
    function toTreeLeaf(item) {
      onIterateItem(item);
      return {
        id : item[fieldMapping['id']] || item['id'],
        text : item[fieldMapping['text']] || item['text'],
        iconCls:item[fieldMapping['iconCls']] || item['iconCls'],
        data:item
      }
    }
    var tree = [];
    $.each(data,function(i,item){
      var leaf = toTreeLeaf(item);
      var children = item[fieldMapping['children']] || item['children'];
      if(children && $.isArray(children) && children.length > 0){
        children = toTreeData(children,fieldMapping,onIterateItem);
        leaf['children']=children;
      }
      tree.push(leaf);
    });
    return tree;
  }
  
 var NavMenu = function() {
   var ctTopNav = $("#topNavBar"),ctLeftNav = $("#leftNav"),itemClictEvents=[],menuIterateEvents=[];
   this.iniNavMenu=iniNavMenu;
   this.addMenuIterateListener = function(evt){
     if($.isFunction(evt) && menuIterateEvents.indexOf(evt) == -1){
       menuIterateEvents.push(evt);
     }
   }
   this.addMenuClickListener = function(evt){
     if($.isFunction(evt) && itemClictEvents.indexOf(evt) == -1){
       itemClictEvents.push(evt);
     }
   }
   this.select = select;
   
   function select(idx) {
     ctTopNav.find('a:eq('+idx+')').trigger('click');
   }
   
   function iniNavMenu(menus) {
     if(!menus || typeof(menus) == 'string' || !$.isArray(menus)){
       detectMenus(menus,iniNavMenu);
       return;
     }
     ctTopNav.empty();
     ctLeftNav.empty();
     $.each(menus,function(i,menu){
       onMenuIterate(menu);
       var el = createTopNavMenuItem(menu,onItemClick);
       var accordion = createAccordion(menu,onItemClick);
       el.data("$accordion",accordion);
     });
     select(0);
   }
   function onMenuIterate(menu) {
     $.each(menuIterateEvents,function(i,evt){
       evt(menu);
     });
   }
   function onItemClick(el,menu) {
     $.each(itemClictEvents,function(i,evt){
       evt(el,menu);
     });
   }
   function detectMenus(data,callback){
     if(data && typeof data == 'string') {
       if(data.charAt(0) == '{'){
         callback(JSON.parse(data));
       }else{
         $.ajax({
           url:data,
           success:function(result){
             if(result && result.code == 0) {
               callback(result.data)
             }
           },
           type:'POST',
           dataType:'JSON'
         });
       }
     }
   }
   
   function getCurrentTopNav() {
     return ctTopNav.find(".l-btn-plain-selected");
   }
   
   function createTopNavMenuItem(menuItem,onclick) {
     var el = $("<a href='javascript:'></a>").text(menuItem.menuTitle).on('click',function(){
       var accordion = getCurrentTopNav().removeClass('l-btn-plain-selected').data('$accordion');
       if(accordion){
         accordion.hide();
       }
       accordion = el.addClass('l-btn-plain-selected').data('$accordion');
       if(accordion){
         accordion.show();
       }
       onclick(el,menuItem);
     });
     el.linkbutton({plain:true,iconCls:menuItem.menuIcon}).appendTo(ctTopNav);
     el.data('menu',menuItem);
     return el;
   }
   
   function createAccordion(parentMenu,onItemClick) {
     var el = $("<div></div>").accordion({fit:true, border:false,multiple:true}).appendTo(ctLeftNav);
     if(parentMenu.childrens){
       $.each(parentMenu.childrens,function(i,item){
         onMenuIterate(item);
         //create accordion panel
         el.accordion('add',{title:item.menuTitle,iconCls:item.menuIcon});
         var panels = el.accordion('panels');
         var $panel=panels[panels.length - 1];
         if(item.menuUrl) {
           $panel.panel('header').bind('click',function(){
             onItemClick($panel,item);
           });
         }
         if($.isArray(item.childrens)){
           $.each(item.childrens,function(i,cItem){
             onMenuIterate(cItem);
             createAccordionItem($panel,cItem,onItemClick);
           });
         }
       });
     }
     return el;
   }
   
   function createAccordionItem($panel,menuItem,onItemClick) {
     var body = $panel.panel('body');
     if(!menuItem.childrens || menuItem.childrens.length == 0){
       var el = $("<a href='javascript:' style='width:100%'></a>").text(menuItem.menuTitle).on('click',function(){
         onItemClick(el,menuItem);
       });
       el.linkbutton({plain:true,iconCls:menuItem.menuIcon}).appendTo(body);
       return;
     }
     var tree = $("<ul></ul>").tree({
       data:toTreeData(menuItem.childrens,{id:'menuCode',text:'menuTitle',iconCls:'menuIcon',children:'childrens'},onMenuIterate),
       onClick:function(node){
         onItemClick(node.target,node.data || node);
       }
     });
     tree.appendTo(body);
   }
 }
 
 var IndexPage = function() {
   var $nav = new NavMenu(),$tabs = $('#tabPages'),$pwdwin=$('#editPassword'),$tabCtxMenu=$("#tabCtxMenu");
   //初始化导航菜单
   $nav.iniNavMenu($rest('fmxMenuRest','getCurrentNavigableMenus'));
   $nav.addMenuClickListener(function(el,menu){
     addTab({title:menu.menuTitle,url:menu.menuUrl,iconCls:menu.menuIcon,closable:true})
   });
   $nav.addMenuIterateListener(function(menu){
     if(menu.isAutoShow){
       addTab({title:menu.menuTitle,url:menu.menuUrl,iconCls:menu.menuIcon,closable:true})
     }
   });
   $tabCtxMenu.find('[act]').on('click',function(){
     var act = this.getAttribute('act');
     switch (act) {
    case 'refresh'://刷新
      var page = $tabs.tabs("getSelected").find('iframe:first');
      page.attr('src',page.attr('src'));
      break;
    case 'close'://关闭
      var tabs = $tabs.tabs('tabs');
      if(tabs){
        for(var i = 0 ; i< tabs.length;i++){
          var tab = tabs[i];
          if (tab.panel('options').tab.hasClass('tabs-selected')){
            $tabs.tabs('close',idx);
          }
        }
      }      
    case 'closeAll'://关闭所有
      $tabs.find("div.tabs-header ul.tabs span.tabs-closable").each(function(i,el){
        $tabs.tabs('close',$(el).text());
      });
      break;
    case 'closeOther'://关闭其他
      $tabs.find('div.tabs-header ul.tabs span.tabs-closable').each(function(i,el){
        var $el = $(el);
        if(!$el.parent().parent().hasClass('tabs-selected')){
          $tabs.tabs('close',$(el).text());
        }
      }); 
      break;
    case 'closeRight': //关闭右边
      $tabs.find('div.tabs-header ul.tabs li.tabs-selected').nextAll().each(function(i,el){
        var text = $(el).find('.tabs-closable').text();
        if(text){
          $tabs.tabs('close',text);
        }
      });
      break;
    case 'closeLeft'://关闭左边
      $tabs.find('div.tabs-header ul.tabs li.tabs-selected').prevAll().each(function(i,el){
        var text = $(el).find('.tabs-closable').text();
        if(text){
          $tabs.tabs('close',text);
        }
      });
      break;
    }
   });
   $tabs.tabs("options").onContextMenu = function(e,title,idx){
     $tabCtxMenu.menu("show", {
       left: e.pageX,
       top: e.pageY
     });
   };
   
   function addTab(opts){    
     if(!opts.url || !opts.title){
       return;
     }
     function createTab() {
       if($tabs.tabs('tabs').length > 12){
         $.messager.alert("提示","你打开的页面数量太多了,请关掉一部分",'info');
         return;
       }
       var url = $url(opts.url);
       $tabs.tabs("add", {
           title: opts.title,
           iconCls: opts.iconCls,
           closable: !!opts.closable,
           fit: true,
           width: $tabs.parent().width(),
           height: "auto",
           content: "<iframe scrolling='no' frameborder='0' style='width:100%;height:100%' marginwidth='0px' marginheight='0px' src='" + url + "'></iframe>"
       });
     }
     var tab = $tabs.tabs("getTab", opts.title);
     if(tab){//已存在
       if(opts.focus){
         $tabs.tabs("close", opts.title);
         createTab();
       }else{
         $tabs.tabs("select", opts.title);
       }
     }else{
       createTab();
     }
   }
   this.addTab = addTab;
 }
 //initial index page
 $(function(){
   $obj['$page'] = new IndexPage();
 });
})(this,$);