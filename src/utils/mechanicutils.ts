import { Attribute, Mechanic, ObjectInfo, ObjectType } from '../objectInfos';


function includesIgnoreCase(arr: string[], value: string) {
	return arr.some((v) => v.toLowerCase() === value.toLowerCase());
}

function attributeIsInheritable(attribute: Attribute) {
	return attribute.inheritable === undefined || attribute.inheritable !== false;
}

// Utility to get mechanic data by name
export function getMechanicDataByName(name: string, type: ObjectType) {
	return ObjectInfo[type].datasetMap.get(name.toLowerCase());
}

// Utility to get mechanic data by class
function getMechanicDataByClass(name: string, type: ObjectType) {
	return ObjectInfo[type].datasetClassMap.get(name.toLowerCase());
}

export function getAllAttributes(mechanic: Mechanic, type: ObjectType) {
	let attributes = mechanic.attributes;
	if (mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (!parentMechanic) {
			return attributes;
		}
		let parentMechanicAttributes = getAllAttributes(parentMechanic, type);
		parentMechanicAttributes = parentMechanicAttributes.filter((attr: Attribute) =>
			attributeIsInheritable(attr)
		);
		attributes = attributes.concat(parentMechanicAttributes);
	}
	return attributes;

}

// Utility to get attribute data by name
export function getAttributeDataByName(mechanic: Mechanic, attributeName: string, type: ObjectType) {
	const attribute = mechanic.attributes.find((attr: Attribute) => includesIgnoreCase(attr.name, attributeName));
	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName, type);
		}
	}
	return attribute;
}




function getInheritedAttributeDataByName(mechanic: Mechanic, attributeName: string, type: ObjectType) {

	const attribute = mechanic.attributes.find((attr: Attribute) => attributeIsInheritable(attr) && includesIgnoreCase(attr.name, attributeName));

	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName, type);
		}
	}
	return attribute;
}
