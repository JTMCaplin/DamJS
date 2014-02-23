var DamJS = function(ko) {
    this.ko = ko; //KO must be passed in, as different version may already be on page
    this.newMatcherText = this.ko.observable("/FX/EURUSD/SPOT/EUR/500");
    this.matchers = this.ko.observableArray();
    this.subscriptionsCalled = this.ko.observableArray();
    this.interceptedData = this.ko.observableArray();
    this.plugins = this.ko.observableArray();
    var self = this;
}

DamJS.prototype.addNewMatcher = function() {
    return this._addMatcher(this.newMatcherText());
}

DamJS.prototype._addMatcher = function(subscription) {
    var matcher = new DamJSMatcher(this.ko, subscription);
    this.matchers.push(matcher);
    return matcher
}

DamJS.prototype.copySubscriptionToMatcher = function(self, subscription) {
    //Architecture of KO prevents knowing object when method invoked
    self._addMatcher(subscription.args[0].getSubject());
}

DamJS.prototype.onSubscribe = function(joinPoint) {
    this.subscriptionsCalled.push(joinPoint);

    var subject = joinPoint.args[0].getSubject();
    var filtered = false;
    this.matchers().forEach(function(matcher){
        if (matcher.outFiltered(subject)) {
            filtered = true;
        }
    });
    if (!filtered) {
        return joinPoint.proceed();
    }
}

DamJS.prototype._addDataToIntercepted = function(joinPoint) {
    var fieldArray = [];
    var fieldsMap = joinPoint.target.getFields();
    for (var key in fieldsMap) {
        fieldArray.push({key: this.ko.observable(key), value: this.ko.observable(fieldsMap[key])});
    }
    joinPoint.damFields = this.ko.observableArray(fieldArray);
    this.interceptedData.push(joinPoint);
}

DamJS.prototype.onData = function(joinPoint) {
    var subject = joinPoint.target.getSubject();
    var filtered = false;
    this.matchers().forEach(function(matcher){
        if (matcher.inFiltered(subject)) {
            filtered = true;
            this._addDataToIntercepted(joinPoint);
        }
    }.bind(this));
    this.plugins().forEach(function(plugin) {
        if (plugin.inFiltered(subject)) {
            filtered = true;
            plugin.onData(joinPoint);
        }
    });
    if (!filtered) {
        return joinPoint.proceed();
    }
}

DamJS.prototype.forwardInterceptedData = function(self, data) {
    data.damFields().forEach(function(field) {
        data.target._fields[field.key()] = field.value();
    });
    data.proceed();
    self.interceptedData.remove(data);
}

DamJS.prototype.addPlugin = function(plugin) {
    this.plugins.push(plugin);
}

function DamJSMatcher(ko, subscription) {
    this.matcher = subscription;
    this.outFilter = ko.observable(false);
    this.inFilter = ko.observable(false);
}

DamJSMatcher.prototype.inFiltered = function(subject) {
    return (this.inFilter() && subject === this.matcher)
}

DamJSMatcher.prototype.outFiltered = function(subject) {
    return (this.outFilter() && subject === this.matcher)
}