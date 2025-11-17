// admin.js
let currentMessageFilter = 'unread';

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active state from all tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('border-green-500', 'text-green-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab and set active state
    document.getElementById('tab-content-' + tabName).classList.remove('hidden');
    document.getElementById('tab-' + tabName).classList.add('border-green-500', 'text-green-600');
    document.getElementById('tab-' + tabName).classList.remove('border-transparent', 'text-gray-500');
    
    // Load tab data
    if (tabName === 'messages') {
        loadMessages(currentMessageFilter);
    } else if (tabName === 'newsletter') {
        loadNewsletterSubscribers();
    } else if (tabName === 'analytics') {
        loadAnalytics();
    } else if (tabName === 'donations') {
        loadDonations();
    }
}

function loadMessages(filter = 'unread') {
    currentMessageFilter = filter;
    
    fetch(`admin_ajax.php?action=get_messages&filter=${filter}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('messages-container');
            
            if (data.messages.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-gray-500">No messages found.</div>';
                return;
            }
            
            container.innerHTML = data.messages.map(message => `
                <div class="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${message.is_read ? '' : 'border-l-4 border-l-blue-500 bg-blue-50'}" 
                     onclick="openMessage(${message.id})">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="font-semibold text-gray-900">${message.name}</span>
                                <span class="text-sm text-gray-500">${message.email}</span>
                                ${!message.is_read ? '<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>' : ''}
                            </div>
                            <h4 class="font-medium text-gray-800 mb-1">${message.subject}</h4>
                            <p class="text-sm text-gray-600 truncate">${message.message.substring(0, 100)}...</p>
                        </div>
                        <div class="text-right text-sm text-gray-500">
                            ${new Date(message.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            `).join('');
        });
}

function openMessage(messageId) {
    fetch(`admin_ajax.php?action=get_message&id=${messageId}`)
        .then(response => response.json())
        .then(message => {
            // Mark as read
            fetch(`admin_ajax.php?action=mark_read&id=${messageId}`);
            
            // Update modal content
            document.getElementById('modal-title').textContent = message.subject;
            document.getElementById('modal-content').innerHTML = `
                <div class="space-y-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold">From: ${message.name}</p>
                            <p class="text-gray-600">${message.email}</p>
                        </div>
                        <span class="text-sm text-gray-500">${new Date(message.created_at).toLocaleString()}</span>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-800 whitespace-pre-line">${message.message}</p>
                    </div>
                </div>
            `;
            
            // Set reply form data
            document.getElementById('reply-message-id').value = message.id;
            document.getElementById('reply-email').value = message.email;
            document.getElementById('reply-to-email').value = message.email;
            document.getElementById('reply-subject').value = `Re: ${message.subject}`;
            document.getElementById('reply-message').value = '';
            
            // Show modal
            document.getElementById('messageModal').classList.remove('hidden');
            document.getElementById('messageModal').classList.add('flex');
        });
}

function closeModal() {
    document.getElementById('messageModal').classList.add('hidden');
    document.getElementById('messageModal').classList.remove('flex');
    loadMessages(currentMessageFilter); // Refresh messages list
}

function sendReply(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('action', 'send_reply');
    formData.append('message_id', document.getElementById('reply-message-id').value);
    formData.append('to_email', document.getElementById('reply-to-email').value);
    formData.append('subject', document.getElementById('reply-subject').value);
    formData.append('message', document.getElementById('reply-message').value);
    
    fetch('admin_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Reply sent successfully!');
            closeModal();
        } else {
            alert('Error sending reply: ' + data.error);
        }
    });
}

function archiveMessage() {
    const messageId = document.getElementById('reply-message-id').value;
    
    fetch(`admin_ajax.php?action=archive_message&id=${messageId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Message archived!');
                closeModal();
            }
        });
}

function loadNewsletterSubscribers() {
    fetch('admin_ajax.php?action=get_subscribers')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('newsletter-container');
            
            if (data.subscribers.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-gray-500">No subscribers found.</div>';
                return;
            }
            
            container.innerHTML = `
                <div class="bg-white border rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${data.subscribers.map(sub => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sub.email}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(sub.subscribed_at).toLocaleDateString()}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${sub.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });
}

function downloadSubscribers() {
    window.open('admin_ajax.php?action=download_subscribers', '_blank');
}

function loadAnalytics() {
    fetch('admin_ajax.php?action=get_analytics')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('analytics-container');
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white border rounded-lg p-6">
                        <h4 class="text-lg font-semibold mb-4">Page Visits (Last 7 Days)</h4>
                        <div class="space-y-3">
                            ${Object.entries(data.page_visits).map(([page, count]) => `
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">${page.charAt(0).toUpperCase() + page.slice(1)} Page</span>
                                    <span class="font-semibold">${count} visits</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="bg-white border rounded-lg p-6">
                        <h4 class="text-lg font-semibold mb-4">Recent Activity</h4>
                        <div class="space-y-3 text-sm">
                            ${data.recent_activity.map(activity => `
                                <div class="flex justify-between items-center py-2 border-b">
                                    <span>${activity.description}</span>
                                    <span class="text-gray-500 text-xs">${new Date(activity.time).toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
}

function loadDonations() {
    fetch('admin_ajax.php?action=get_donations')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('donations-container');
            
            if (data.donations.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-gray-500">No donations recorded.</div>';
                return;
            }
            
            container.innerHTML = `
                <div class="bg-white border rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${data.donations.map(donation => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">${donation.donor_name || 'Anonymous'}</div>
                                        <div class="text-sm text-gray-500">${donation.donor_email || 'No email'}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${donation.amount}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${donation.frequency}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${donation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                              donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-red-100 text-red-800'}">
                                            ${donation.status}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${new Date(donation.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadMessages('unread');
});