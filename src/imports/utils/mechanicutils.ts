import { ObjectInfo, ObjectType } from '../../objectInfos';


// Utility to get mechanic data by name
function getMechanicDataByName(name: string, type: ObjectType) {
	//return dataset.find((mechanic: any) => mechanic.name.includes(name.toLowerCase()));
	return ObjectInfo[type].datasetMap.get(name.toLowerCase());
}

// Utility to get all mechanics that have a name that starts with a certain string
function getMechanicsByPrefix(prefix: string, type: ObjectType) {
	return ObjectInfo[type].dataset.filter((mechanic: any) => mechanic.name.some((name: string) => name.startsWith(prefix.toLowerCase())));
}

// Utility to get mechanic data by class
function getMechanicDataByClass(name: string, type: ObjectType) {
	//return dataset.find((mechanic: any) => mechanic.class === name);
	return ObjectInfo[type].datasetClassMap.get(name.toLowerCase());
}

function getAllAttributes(mechanic: any, type: ObjectType) {
	let attributes = mechanic.attributes;
	if (mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (!parentMechanic) {
			return attributes;
		}
		let parentMechanicAttributes = getAllAttributes(parentMechanic, type);
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
function getAttributeDataByName(mechanic: any, attributeName: string, type: ObjectType) {
	var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		return getInheritedAttributeDataByName(parentMechanic, attributeName, type);
	}
	return attribute;
}
function getInheritedAttributeDataByName(mechanic: any, attributeName: string, type: ObjectType) {

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
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName, type);
		}
	}
	return attribute;
}

export { getMechanicDataByName, getMechanicsByPrefix, getMechanicDataByClass, getAllAttributes, getAttributeDataByName, getInheritedAttributeDataByName };