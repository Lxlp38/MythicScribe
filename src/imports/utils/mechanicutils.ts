import { mechanicsDataset } from '../../objectInfos';


// Utility to get mechanic data by name
function getMechanicDataByName(name: string, dataset = mechanicsDataset) {
	return dataset.find((mechanic: any) => mechanic.name.includes(name.toLowerCase()));
}

// Utility to get all mechanics that have a name that starts with a certain string
function getMechanicsByPrefix(prefix: string, dataset = mechanicsDataset) {
	return dataset.filter((mechanic: any) => mechanic.name.some((name: string) => name.startsWith(prefix.toLowerCase())));
}

// Utility to get mechanic data by class
function getMechanicDataByClass(name: string, dataset = mechanicsDataset) {
	return dataset.find((mechanic: any) => mechanic.class === name);
}

function getAllAttributes(mechanic: any, dataset = mechanicsDataset) {
	let attributes = mechanic.attributes;
	if (mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, dataset);
		if (!parentMechanic) {
			return attributes;
		}
		let parentMechanicAttributes = getAllAttributes(parentMechanic, dataset);
		const parentMechanicInheritableAttributes = parentMechanic.inheritable_attributes;
		if (parentMechanicInheritableAttributes) {
			parentMechanicAttributes = parentMechanicAttributes.filter((attr: any) =>
				parentMechanicInheritableAttributes.includes(attr.name[0].toLowerCase())
			);
		}
		attributes = attributes.concat(parentMechanicAttributes);
	}
	return attributes;

}

// Utility to get attribute data by name
function getAttributeDataByName(mechanic: any, attributeName: string, dataset: any = mechanicsDataset) {
	var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, dataset);
		return getInheritedAttributeDataByName(parentMechanic, attributeName, dataset);
	}
	return attribute;
}
function getInheritedAttributeDataByName(mechanic: any, attributeName: string, dataset: any) {

	var attribute = null;

	if (mechanic.inheritable_attributes) {
		if (mechanic.inheritable_attributes.includes(attributeName.toLowerCase())) {
			var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
		}
	}
	else {
		var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
	}

	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, dataset);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName, dataset);
		}
	}
	return attribute;
}

export { getMechanicDataByName, getMechanicsByPrefix, getMechanicDataByClass, getAllAttributes, getAttributeDataByName, getInheritedAttributeDataByName };