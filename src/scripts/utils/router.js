import Path from "path";
import Util from "./tool.js";
import _History from "history/lib/createBrowserHistory";

export default class Router{
    constructor(){
        
    }
    
    
    
}

/**
 * 全局路由函数
 */
var router = (function () {
    var Path = require("path");
    var Util = require("./tool.js");
    var _History = require("history/lib/createBrowserHistory");//注册H5 History

    var ViewPath = Path.join("/", "./view");

    var History = null;

    var homePath = "/common/home";
    var curPath = "";
    var dstPath = "";

    //页面卸载前响应事件
    var beforePageUnload = $.noop;



	/**
	 * 注册路由
	 * 
	 */
    function initHistory() {
        History = _History() || {};

        //注册跳转前执行事件
        History.listenBefore(function (transition) {
            var pathname = getLocation().pathname;
            dstPath = !pathname || $.trim(pathname) === "/" ? homePath : pathname;
            return _beforePageUnload();
        });

        //注册跳转后执行事件
        History.listen(function (transition) {
            var pathname = getLocation().pathname;
            dstPath = !pathname || $.trim(pathname) === "/" ? homePath : pathname;
            //跳转指定页面
            _loadPage(dstPath);
        });

    }


	/**
	 * 跳转指定页面
	 * 
	 * @param pathname 指定页面pathname
	 * @param queryObj 查询参数对象
	 * @param isReplace 是否使用replaceState，默认状态下是pushState，若设置为true，则前一页的历史记录不会被保存
	 */
    function gotoUrl(pathname, queryObj, isReplace) {
        var queryString = "";

        if (queryObj != null && $.isPlainObject(queryObj)) {
            var queryArr = [];
            $.each(queryObj, function (key, val) {
                queryArr.push(key + "=" + encodeURIComponent(val));
            });
            queryString = "?" + queryArr.join("&");
        }

        History[isReplace === true ? "replace" : "push"]({
            pathname: "/?" + (pathname || "/") + queryString,
            state: {
                pathname: pathname,
                query: queryObj,
                search: queryString
            }
        });
    }


	/**
	 * 获取查询参数对象
	 * 
	 * @param href 截取查询参数的完整url路径
	 * @returns (description)
	 */
    function getQuery() {
        return getLocation().query;
    }


	/**
	 * 获取Location信息
	 * 
	 * @returns Location对象（pathname,query,search）
	 */
    function getLocation() {
        var href = window.location.href;
        //pathname
        var pathnameMatch = window.location.search.match(/(?:\?)([/\w]*)(?:\?|$)/);
        var pathname = pathnameMatch && pathnameMatch.length > 1 ? pathnameMatch[1] : "";
        //search
        var search = href.substring(href.lastIndexOf("?")); //根路径时有问题

        //query
        var query = {};
        search.replace(/([^?&=]+)=([^?&=#]*)/g, function (rs, $1, $2) {
            var name = decodeURIComponent($1);
            var val = decodeURIComponent($2);

            //类型装换
            if ($.trim(val).toLowerCase() === true.toString()) {
                val = true;
            } else if ($.trim(val).toLowerCase() === false.toString()) {
                val = false;
            } else if ($.isNumeric(val)) {
                val = (Number(val));
            } else {
                val = String(val);
            }

            query[name] = val;

            return rs;
        });

        return {
            pathname: pathname,
            query: query,
            search: search
        }
    }



    /**
     * 刷新子页面
     * 
     * @returns (description)
     */
    function reload() {
        return _loadPage(curPath);
    }


	/**
	 * 根据pathname加载指定页面
	 * 
	 * @param pathname 即将跳转的pathname
	 * @returns 跳转后延迟对象
	 */
    function _loadPage(pathname) {
        if (pathname == null || pathname.length === 0) return;

        return $.ajax({
            type: "get",
            url: Path.join(ViewPath, pathname) + ".html",
            dateType: "html",
            beforeSend: function () {
                Util.showLoading();
            },
            success: function (resp) {
                Util.hideLoading();
                // todo 解析resp

                if (_beforePageLoad(resp) != false) {
                    $("#sy-ctn").html(resp);
                    beforePageUnload = $.noop;
                    curPath = dstPath;
                    //dstPath = "";
                }
            },
            error: function () {
                console.error("获取页面失败");
            }
        });
    }

    /**
     * 根据pathname卸载页面
     * 
     * @param pathname 要卸载的页面pathname
     * @returns (description)
     */
    function _unloadPage(pathname) {
        //卸载当前页面组件
        //当页面中包含未加载完毕的项，不可卸载
        if (Util.loadingCount > 0) return false;
        Util.closeDialog();
    }


    /**
     * 页面加载前执行事件
     * 
     * @param html 要加载的页面内容
     * @returns return false,阻止页面加载
     */
    function _beforePageLoad(html) {
        console.log("[_beforePageLoad] 上一页:", curPath, "当前页面:", dstPath);
        //todo 全局初始化页面
    }


    /**
     * 页面卸载前执行事件
     * 
     * @returns return false，阻止页面卸载
     */
    function _beforePageUnload() {
        console.log("[_beforePageUnload] 当前页面:", curPath, "目标页面:", dstPath);
        if (_unloadPage() === false) return false;
        //执行用户定义页面卸载事件,若事件return false 阻止卸载
        if (typeof beforePageUnload === "function" && beforePageUnload.call(this, dstPath, curPath) === false) return false;
    }




    return {
        initHistory: initHistory,
        gotoUrl: gotoUrl,
        getQuery: getQuery,
        getLocation: getLocation,
        beforePageUnload: function (cb) {
            beforePageUnload = cb;
        }
    }



} ());

module.exports = router;