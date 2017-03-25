var Router = {};

(function (Router) {
	var routes = {}
	
	var refsAttr = 'sup-ref';

	Router.init = function () {
		if (!location.hash) {
			location.hash = '#/';
		}
		
		var refs = document.querySelectorAll('a['+refsAttr+']');
		
		var clickHandler = function (event) {
			event.preventDefault();
			event.stopPropagation();
			
			var url = this.getAttribute(refsAttr);
			
			if (/#/.test(url)) {
				url = url.replace(/#/);
			}
			
			goUrl(url);
		}
		
		for (var i = 0, n = refs.length; i < n; i++) {
			var element = refs[i];
			
			// Мы можем объявить в ссылке атрибут sup-ref как goUrl('test_2', {id: 'werrg'})
			// Проверяем именно этот случай
			// нам надо заменить этот вызов на то, что она возвращает(на конкретный урл)
			var regExp = new RegExp("goUrl", 'i');
			var attr = element.getAttribute(refsAttr);
			if (regExp.test(attr)) {
				var matches = attr.match(/goUrl\((.*)\)/);
				if (matches.length) {
					var params = matches[1];
					if (!params) {
						throw new Error('Expected Parameters for refference '+element.innerHTML);
					}
					
					// фигурная скобка что бы учесть объекты, в которых > 1 поля
					params = params.split(', {');
					params[0] = params[0].replace(/\'/g, '');
					
					if (params[1]) {
						params[1] = '{'+params[1];
						params[1] = params[1].replace(/\'/g, '"');
						console.log(params[1]);
						params[1] = JSON.parse(params[1]);
					}
					
					var url = getDestinationUrl(params[0], params[1]);
					element.setAttribute(refsAttr, url);
				}
			}
			
			element.addEventListener('click', clickHandler);
			
		}
		
		goUrl(location.hash.replace(/#/, ''));
	}

	function setUrl(url)
	{
		location.hash = '#' + url;
	}

	/**
	* @parameter route Route name or url
	* @parameter paramsObject Parameters for the route
	**/
	function goUrl(route, paramsObject)
	{
		var r = {};
		destinationUrl = getDestinationUrl(route, paramsObject, r);
		
		console.log(destinationUrl);
		setUrl(destinationUrl);
		
		var ob = {
			title: document.title,
			url: r.url
		};
		
		//history.pushState(ob, ob.title, ob.url);
		
		if (r.action) {
			r.action();
		}
	}
	
	function getDestinationUrl(route, paramsObject, r)
	{
		if (r === undefined) {
			r = {};
		}
		
		var routeIsName = false;// если route то имя роута
		if (routes[route]) {
			r = extend(r, routes[route]);
			routeIsName = true;
		} else {
			for (key in routes) {
				var url = '';
				var currentRoute = routes[key];
				while(true) {
					var r1 = currentRoute.url.replace(/^\//, '');
					if (currentRoute.url && !url && !r1) {
						r1 = currentRoute.url;
					}
					var r2 = url.replace(/^\//, '');
					url = url ? r1 + '/' + r2 : r1;
					if (currentRoute.parent) {
						currentRoute = routes[currentRoute.parent];
					} else {
						break;
					}
				}
				url = url.replace(/\/\//gi, '\/');
				var urlParts = url.split('/');
				// Remove first element from the array
				urlParts.shift();
				var newUrl = '';
				// Разбваем урл на части, что бы сделать regexp
				for (var i = 0; i < urlParts.length; i++) {
					newUrl += '/' + urlParts[i].replace(/{.*}/, '[^/]+');
				}
				
				var regExp = new RegExp('^'+newUrl+'$', 'i');
				if (regExp.test(route)) {
					r = extend(r, routes[key]);
					break;
				}
			}
		}
		
		if (!r.url) {
			throw new Error('Unknown route');
		}
		
		if (routeIsName) {
			destinationUrl = formDestinationUrl(r.url, paramsObject, r, true);
		} else {
			destinationUrl = formDestinationUrl(route, paramsObject, r);
		}
		
		return destinationUrl;
	}

	/**
	* Формируем из роута урл, подставляя параметры, если это необходимо
	**/
	function formDestinationUrl(route, paramsObject, r, isRoute)
	{
		var urlParts = route.split('/');
		// Remove first element from the array
		urlParts.shift();
		var destinationUrl = '';
		for (var i = 0; i < urlParts.length; i++) {
			// Если надо подставлять параметры
			if (/{/.test(urlParts[i]) || /}/.test(urlParts[i])) {
				var part = urlParts[i].replace(/{/, '');
				part = part.replace(/}/, '');
				if (!paramsObject[part]) {
					throw new Error();
				}
				destinationUrl += '/' + paramsObject[part];
			} else {
				destinationUrl += '/' + urlParts[i];
			}
		}
		
		// если route это урл из текущего роута, 
		// то нам надо опросить его родителей и сформировать окончательный url
		// а иначе нам приходит нормальный урл
		if (r.parent && isRoute) {
			destinationUrl = formDestinationUrl(routes[r.parent].url, paramsObject, routes[r.parent]) + destinationUrl;
			destinationUrl = destinationUrl.replace(/\/\//, '\/');
		}
		
		return destinationUrl;
	}
	
	function extend(ob1, ob2)
	{
		for (var key in ob2) {
			if (ob2.hasOwnProperty(key)) {
				ob1[key] = ob2[key];
			}
		}
		return ob1;
	}
	
	/**
	* Add new route
	*
	* sample
	* {
		url: /,
		action: function (){}
	* }
	**/
	Router.add = function (name, settings) {
		routes[name] = settings;
	}
	
	Router.goUrl = function (route, paramsObject) {
		goUrl(route, paramsObject);
	}
})(Router);
