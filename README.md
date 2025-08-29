# Install PNPM localy
`npm install -g pnpm --prefix ~/.local`

## Then add this to your shell config (e.g., .bashrc, .zshrc):
`export PATH="$HOME/.local/bin:$PATH"

echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> ~/.zshrc
echo 'export PNPM_STORE_PATH="$HOME/.pnpm-store"' >> ~/.zshrc
echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.zshrc
`


# Install NVM (Virtual Node Enviroment) to use Node 24

## Get the Node Virtual Manager
`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
`source ~/.nvm/nvm.sh`

## Install Node24
`nvm install 24`
`nvm use 24`

## make it default
`nvm alias default 24`

# Enviroment
Use a .env loader
I use the plugin 'autoenv' in OhMyZSH for loading the .env

## OhMyZSH
`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`

## AutoEnv
`git clone https://github.com/inishchith/autoenv ~/.autoenv`
`echo 'source ~/.autoenv/activate.sh' >> ~/.zshrc`
`echo 'source ~/.autoenv/activate.sh' >> ~/.zshrc`
