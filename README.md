# kube-helper

Kube Helper is a wrapper for common kubectl commands that simplifies Kubernetes management by providing quick access to common kubectl commands directly within VSCode.

## How to install
Download the vsix file from Releases and run the following command

```sh
code --install-extension  kube-helper-<version>.vsix

# like
code --install-extension  kube-helper-0.0.1.vsix
```


## Features

* List Resources like Pods, services, etc., in a cluster
* Edit definition of resources like pods, deployments from VSCode
* View logs directly in VSCode
* Exec into Containers
* Port forward resources

![list namespaces](docs/feat_img_1.png)
![namespace details](docs/feat_img_3.png)
![view pod details](docs/feat_img_2.png)

## Requirements

This extension depends on kubectl cli. Make sure it is accessible.

## Extension Settings

Click on the side bar icon to activate the extension

## Known Issues

* Doesn't support all resources. Raise a feature request ticket if you are in need of something


## Credits
Icons by [icons8.com](https://icons8.com)