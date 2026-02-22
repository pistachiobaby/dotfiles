{
  description = "CLI tools for dotfiles";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [
        "x86_64-darwin"
        "aarch64-darwin"
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems f;
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfreePredicate = pkg:
              builtins.elem (nixpkgs.lib.getName pkg) [ "terraform" ];
          };
        in
        {
          default = pkgs.buildEnv {
            name = "dotfiles-tools";
            paths = [
              pkgs.fzf
              pkgs.gh
              pkgs.gum
              pkgs.kubernetes-helm
              pkgs.kind
              pkgs.nodejs
              pkgs.xxh
              pkgs.zellij
              pkgs.zsh
              pkgs.zsh-autosuggestions
              pkgs.zsh-syntax-highlighting
              pkgs.coder
              pkgs.shopify-cli
              pkgs.starship
            ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
              pkgs.terminal-notifier
            ];
          };
        }
      );
    };
}
