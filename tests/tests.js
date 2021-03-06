function MockJoinPoint() {
    this.args = [];
    this.proceed = sinon.stub().returns('test');
    this.target = null;
}

function MockSubscriptionImpl(subject) {
    this.subject = subject;
    this.getSubject = sinon.stub().returns(this.subject);
}

function MockRecordType1Event(subject) {
    this.subject = subject;
    this.getSubject = sinon.stub().returns(this.subject);
    this._fields = {key1: "value1", key2: "value2"};
    this.getFields = sinon.stub().returns(this._fields);
}

module("Outgoing Tests", {
    setup: function() {
        mockSubscriptionImpl = {};
        mockCommandResponse = {
          listener: function() {}
        };

        jp = new MockJoinPoint();
        jp.args[0] = mockSubscriptionImpl;
        jp.args[1] = new MockSubscriptionImpl('/FX/EURUSD');

        unfilteredJP = new MockJoinPoint();
        unfilteredJP.args[0] = {};
        unfilteredJP.args[1] = new MockSubscriptionImpl('/FX/USDCHF');

        dataJp = new MockJoinPoint();
        dataJp.target = new MockRecordType1Event('/FX/EURUSD');

        contribJp = new MockJoinPoint();
        contribJp.args[0] = '/FX/EURUSD';
        contribJp.args [1] = {
          key1: 'value1',
          key2: 'value2'
        }

        unfilteredDataJp = new MockJoinPoint();
        unfilteredDataJp.target = new MockRecordType1Event('/FX/USDCHF');
    }
})

test( "returns subscriptionManager", function() {
    var oh = new DamJS(ko);
    var returnedData = oh.onSubscribe(jp);
    ok( jp.proceed.called);
    equal('test', returnedData);
});


test( "matchers let subscriptions through by default", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    oh.onSubscribe(jp);
    ok( jp.proceed.called );
});

test( "matchers stop subscriptions when activated", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.outFilter(true);
    oh.onSubscribe(jp);
    ok( !jp.proceed.called );
});

test( "matchers allow contribs through when activated", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.outFilter(true);

    jp.args[0] = mockCommandResponse;
    oh.onSubscribe(jp);

    ok( jp.proceed.called );
});

test( "matchers only stop subscriptions they match", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    oh.newMatcherText('/FX/USDCHF');
    var matcher2 = oh.addNewMatcher();
    matcher.outFilter(true);

    oh.onSubscribe(jp);
    oh.onSubscribe(unfilteredJP);
    ok( !jp.proceed.called );
    ok( unfilteredJP.proceed.called );
});

// SUBSCRIPTIONS

test( "lists subscriptions that it sees", function() {
    var oh = new DamJS(ko);
    equal( 0, oh.subscriptionsCalled().length);

    oh.onSubscribe(jp);
    equal( 1, oh.subscriptionsCalled().length);

    oh.onSubscribe(jp);
    equal( 2, oh.subscriptionsCalled().length);
});

test( "Copy subscription to matcher", function() {
    var oh = new DamJS(ko);
    equal( 0, oh.subscriptionsCalled().length);

    oh.onSubscribe(jp);
    oh.copySubscriptionToMatcher(oh, oh.subscriptionsCalled()[0]);

    equal( 1, oh.matchers().length);
    equal( '/FX/EURUSD', oh.matchers()[0].matcher);
});

// DATA

test( "lets data through by default", function() {
    var oh = new DamJS(ko);
    var returnedData = oh.onData(dataJp);
    ok( dataJp.proceed.called);
    equal("test", returnedData);
});

test( "matchers let data through by default", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();

    oh.onData(dataJp);
    ok( dataJp.proceed.called );
});

test( "matchers stop data when activated", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.inFilter(true);

    oh.onData(dataJp);
    ok( !dataJp.proceed.called );
});

test( "matchers only stop data they match", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    oh.newMatcherText('/FX/USDCHF');
    var matcher2 = oh.addNewMatcher();
    matcher.inFilter(true);

    oh.onData(dataJp);
    oh.onData(unfilteredDataJp);
    ok( !dataJp.proceed.called );
    ok( unfilteredDataJp.proceed.called );
});

//INTERCEPTED

test( "stopped data is placed in interception array", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.inFilter(true);

    oh.onData(dataJp);
    equal(1, oh.interceptedData().length);
});

test( "stopped contribs are placed in interception array", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.outFilter(true);
    oh.onContrib(contribJp);
    equal(1, oh.interceptedContrib().length);
});

test( "unstopped data is not placed in interception array", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.inFilter(true);

    oh.onData(dataJp);
    oh.onData(unfilteredDataJp);
    equal(1, oh.interceptedData().length);
});

test( "stopped data can be forwarded on", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.inFilter(true);

    oh.onData(dataJp);

    ok( !dataJp.proceed.called );
    equal(1, oh.interceptedData().length);

    oh.forwardInterceptedData(oh, oh.interceptedData()[0]);

    ok( dataJp.proceed.called );
    equal(0, oh.interceptedData().length);
});

test( "stopped contribs can be forwarded on", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.outFilter(true);

    oh.onContrib(contribJp);

    ok( !contribJp.proceed.called );
    equal(1, oh.interceptedContrib().length);

    oh.forwardInterceptedContrib(oh, oh.interceptedContrib()[0]);

    ok( contribJp.proceed.called );
    equal(0, oh.interceptedContrib().length);
});

test( "stopped data interception array fields are shown in array", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.inFilter(true);

    oh.onData(dataJp);
    equal(2, oh.interceptedData()[0].damFields().length);
    equal("key1", oh.interceptedData()[0].damFields()[0].key());
    equal("value1", oh.interceptedData()[0].damFields()[0].value());
    equal("key2", oh.interceptedData()[0].damFields()[1].key());
    equal("value2", oh.interceptedData()[0].damFields()[1].value());
});

test( "stopped contrib interception array fields are shown in array", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.outFilter(true);

    oh.onContrib(contribJp);
    equal(2, oh.interceptedContrib()[0].damFields().length);
    equal("key1", oh.interceptedContrib()[0].damFields()[0].key());
    equal("value1", oh.interceptedContrib()[0].damFields()[0].value());
    equal("key2", oh.interceptedContrib()[0].damFields()[1].key());
    equal("value2", oh.interceptedContrib()[0].damFields()[1].value());
});

test( "altered fields will be forwarded on", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.inFilter(true);

    oh.onData(dataJp);
    oh.interceptedData()[0].damFields()[0].value('value3');
    oh.forwardInterceptedData(oh, oh.interceptedData()[0]);

    ok( dataJp.proceed.called );
    equal("value3", dataJp.target.getFields().key1 );
});

test( "altered fields will be forwarded on", function() {
    var oh = new DamJS(ko);
    oh.newMatcherText('/FX/EURUSD');
    var matcher = oh.addNewMatcher();
    matcher.outFilter(true);

    oh.onContrib(contribJp);
    oh.interceptedContrib()[0].damFields()[0].value('value3');
    oh.forwardInterceptedContrib(oh, oh.interceptedContrib()[0]);

    ok( contribJp.proceed.called );
    equal("value3", contribJp.args[1].key1 );
});

//PLUGINS

test( "plugins can change data for you", function() {
    var oh = new DamJS(ko);
    var customPlugin = {
        inFiltered: function(subject) {
            return true;
        },
        onData: function(joinPoint) {
            joinPoint.target._fields['key1'] = 'value3';
            joinPoint.proceed();
        }
    }

    oh.addPlugin(customPlugin);
    oh.onData(dataJp);

    ok( dataJp.proceed.called );
    equal("value3", dataJp.target.getFields().key1 );
});
