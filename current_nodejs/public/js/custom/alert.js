function sendAlert(title, message, icon) {
    alertMsg.addMessage(title, message, icon);
}

/** Notification script */
var alertMsg = (function (window, document) {
    var container;
    var messageCount;

    /**
     * Creates a DOM element containing the message and calls the _showMessage function
     * @param {string} title
     * @param {string} message
     */
    var _addMessage = function (title, message, icon) {
        if (messageCount === 0) {
            document.getElementById('alertMsg').classList.add('visible');
        }

        // Create the message container div element
        var div = document.createElement('div');
        div.className = 'alert-msg';
        div.id = 'alertMsg-' + (new Date()).getTime();

        // Create the title element
        var divTitle = document.createElement('div');
        divTitle.className = 'alert-title';
        divTitle.appendChild(document.createTextNode(title));
        div.appendChild(divTitle);

        // Create the close button element
        var spanClose = document.createElement('span');
        spanClose.className = 'fa fa-close alert-close';
        spanClose.addEventListener('click', function (e) {
            _removeMessage(this.parentNode.parentNode);
        })
        divTitle.appendChild(spanClose);

        // Create the message element
        var divMessage = document.createElement('div');
        divMessage.className = 'alert-container';
        div.appendChild(divMessage);
        _showMessage(div);

        // Create the icon span element
        var span = document.createElement('span');
        span.className = 'fa fa-' + icon;
        divMessage.appendChild(span);
        divMessage.appendChild(document.createTextNode(' ' + message));

        // Increment message count
        messageCount++;
    }

    /**
     * Shows notification and adds a 7 second timer
     * @param {DOMelement} elem
     */
    var _showMessage = function (elem) {
        container.insertBefore(elem, document.getElementsByClassName('alert-msg')[0]);

        setTimeout(function () {
            elem.classList.add('active');
        }, 200)

        _updatePosition();

        setTimeout(function () {
            if (document.getElementById(elem.id) !== null) {
                _removeMessage(elem);
            }
        }, 7000)
    }

    /**
    * Removes notification
    * @param {DOMelement} elem
    */
    var _removeMessage = function (elem) {
        elem.classList.remove('active');
        
        setTimeout(function () {
            document.getElementById('alertMsg').removeChild(elem);
            _updatePosition(true);

            // Decrease message count
            messageCount--;

            if (messageCount <= 0) {
                document.getElementById('alertMsg').classList.remove('visible');
                messageCount = 0;
            }
        }, 300)
    }

    /**
    * Updates position of each notification. Used after removing or adding a notification
    * The parameter isRemove is used when removing a notification to correctly position the rest of the messages
    * upwards
    * @param {boolean} isRemove
    */
    var _updatePosition = function (isRemove) {
        if (isRemove === undefined) {
            isRemove = false;
        }

        var existingMessages = document.getElementsByClassName('alert-msg');
        var offsetHeight = 70;

        for (var i = 0; i < existingMessages.length; i++) {
            if (i === 0) {
                if (isRemove) {
                    existingMessages[i].style.transform = 'translateY(0)';
                }

                document.getElementById('alertMsg').style.minHeight = (existingMessages[i].offsetHeight + 20) + 'px';
                offsetHeight += existingMessages[i].offsetHeight;
                continue;
            }

            existingMessages[i].style.transform = 'translateY(' + offsetHeight + 'px)';
            offsetHeight += existingMessages[i].offsetHeight;
            offsetHeight += 20;
        }

        if (existingMessages[0] !== undefined) {
            existingMessages[0].style.removeProperty('transform');
        }
    }

    return {
        init: function () {
            container = document.createElement('div');
            container.id = 'alertMsg';
            document.getElementsByTagName('body')[0].appendChild(container);
            messageCount = 0;
        },
        addMessage: function (title, message, icon) {
            if (title === undefined || title === '') {
                title = 'Impossible de réaliser l\'action';
            }
            if (message === undefined || message === '') {
                message = 'Une erreur inconnue est survenue, merci de réessayer !';
            }
            if (icon === undefined || icon === '') {
                icon = 'exclamation-circle';
            }
            _addMessage(title, message, icon)
        },
    }
}(window, document))

alertMsg.init()