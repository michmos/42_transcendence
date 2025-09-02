async function getUsers() {
	await fetch('/api/user')
		.then(response => response.json())
		.then(data => {
			console.log('Users:', data);

			const userList = document.getElementById('userList');
			if (userList) {
				userList.innerHTML = '';
			}

			const ul = document.createElement('ul');
			ul.id = 'userListItems';
			
			data.message.forEach(user => {
				const li = document.createElement('li');
				li.textContent = `ID: ${user.id}, Email: ${user.email}`;
				ul.appendChild(li);
			});
			
			if (userList) {
				userList.appendChild(ul);
			}
		})
		.catch(error => console.error('Error fetching users:', error));
	}

async function makeUser() {

	await fetch('/api/user', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ /* user data here */ })
	})
	.then(response => response.json())
	.then(async data => {
		console.log('User created:', data)
		await getUsers();
	})
	.catch(error => console.error('Error creating user:', error));
}

async function deleteUser() {
	await fetch('/api/user', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ /* user data here */ })
	})
	.then(response => response.json())
	.then(async data => {
		console.log('User deleted:', data)

		await getUsers();
	})
	.catch(error => console.error('Error deleting user:', error));
}

// Make functions globally available
(window as any).getUsers = getUsers;
(window as any).makeUser = makeUser;
(window as any).deleteUser = deleteUser;
